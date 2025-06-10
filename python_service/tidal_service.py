#!/usr/bin/env python3

import os
import tidalapi
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global session object
tidal_session = None

def get_tidal_session():
    """Get or create TIDAL session"""
    global tidal_session
    
    if tidal_session is None or not tidal_session.check_login():
        email = os.environ.get('TIDAL_EMAIL')
        password = os.environ.get('TIDAL_PASSWORD')
        
        if not email or not password:
            raise Exception("TIDAL_EMAIL and TIDAL_PASSWORD environment variables are required")
        
        tidal_session = tidalapi.Session()
        login_result = tidal_session.login(email, password)
        
        if login_result:
            logger.info(f"Successfully logged in to TIDAL as: {tidal_session.user.name}")
        else:
            raise Exception("Failed to login to TIDAL with provided credentials")
    
    return tidal_session

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        session = get_tidal_session()
        return jsonify({
            'status': 'healthy',
            'logged_in': session.check_login(),
            'user': session.user.name if session.user else None
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/search', methods=['POST'])
def search_tracks():
    """Search for tracks on TIDAL"""
    try:
        data = request.get_json()
        query = data.get('query')
        limit = data.get('limit', 10)
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        session = get_tidal_session()
        search_result = session.search(query, models=[tidalapi.media.Track])
        
        tracks = []
        for track in search_result.tracks[:limit]:
            tracks.append({
                'id': str(track.id),
                'title': track.name,
                'artist': {
                    'name': track.artist.name if track.artist else 'Unknown Artist'
                },
                'artists': [{'name': artist.name} for artist in track.artists] if track.artists else [],
                'duration': track.duration,
                'url': f"https://tidal.com/browse/track/{track.id}"
            })
        
        return jsonify({'tracks': {'items': tracks, 'totalNumberOfItems': len(tracks)}})
    
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/create-playlist', methods=['POST'])
def create_playlist():
    """Create a new playlist on TIDAL"""
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description', '')
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        session = get_tidal_session()
        user_playlist = session.user.create_playlist(title, description)
        
        return jsonify({
            'uuid': user_playlist.id,
            'title': user_playlist.name,
            'description': user_playlist.description or '',
            'numberOfTracks': 0,
            'url': f"https://tidal.com/browse/playlist/{user_playlist.id}"
        })
    
    except Exception as e:
        logger.error(f"Create playlist error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/add-tracks-to-playlist', methods=['POST'])
def add_tracks_to_playlist():
    """Add tracks to a TIDAL playlist"""
    try:
        data = request.get_json()
        playlist_id = data.get('playlist_id')
        track_ids = data.get('track_ids', [])
        
        if not playlist_id or not track_ids:
            return jsonify({'error': 'playlist_id and track_ids are required'}), 400
        
        session = get_tidal_session()
        
        # Get the playlist
        try:
            playlist = session.playlist(playlist_id)
        except:
            return jsonify({'error': 'Playlist not found'}), 404
        
        # Convert track IDs to integers and get track objects
        tracks_to_add = []
        for track_id in track_ids:
            try:
                track = session.track(int(track_id))
                tracks_to_add.append(track)
            except Exception as e:
                logger.warning(f"Failed to get track {track_id}: {str(e)}")
                continue
        
        if tracks_to_add:
            playlist.add(tracks_to_add)
            logger.info(f"Added {len(tracks_to_add)} tracks to playlist {playlist_id}")
        
        return jsonify({'message': f'Added {len(tracks_to_add)} tracks to playlist'})
    
    except Exception as e:
        logger.error(f"Add tracks error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/find-best-match', methods=['POST'])
def find_best_match():
    """Find the best matching track on TIDAL"""
    try:
        data = request.get_json()
        spotify_track = data.get('spotify_track')
        
        if not spotify_track:
            return jsonify({'error': 'spotify_track is required'}), 400
        
        track_name = spotify_track.get('name', '')
        artists = spotify_track.get('artists', [])
        artist_names = ' '.join([artist.get('name', '') for artist in artists])
        
        # Create search query
        query = f"{track_name} {artist_names}".strip()
        
        session = get_tidal_session()
        search_result = session.search(query, models=[tidalapi.media.Track])
        
        if not search_result.tracks:
            return jsonify({
                'track': None,
                'confidence': 0,
                'status': 'failed'
            })
        
        # Get the best match (first result)
        best_match = search_result.tracks[0]
        
        # Calculate confidence based on string similarity
        def calculate_similarity(str1, str2):
            str1, str2 = str1.lower().strip(), str2.lower().strip()
            if str1 == str2:
                return 1.0
            # Simple similarity calculation
            common_words = set(str1.split()) & set(str2.split())
            total_words = set(str1.split()) | set(str2.split())
            return len(common_words) / len(total_words) if total_words else 0
        
        title_similarity = calculate_similarity(track_name, best_match.name)
        artist_similarity = calculate_similarity(
            artist_names, 
            best_match.artist.name if best_match.artist else ''
        )
        
        confidence = int((title_similarity + artist_similarity) / 2 * 100)
        
        # Determine status
        if confidence >= 85:
            status = 'success'
        elif confidence >= 60:
            status = 'partial'
        else:
            status = 'failed'
        
        track_info = {
            'id': str(best_match.id),
            'title': best_match.name,
            'artist': {
                'name': best_match.artist.name if best_match.artist else 'Unknown Artist'
            },
            'artists': [{'name': artist.name} for artist in best_match.artists] if best_match.artists else [],
            'duration': best_match.duration,
            'url': f"https://tidal.com/browse/track/{best_match.id}"
        }
        
        return jsonify({
            'track': track_info,
            'confidence': confidence,
            'status': status
        })
    
    except Exception as e:
        logger.error(f"Find best match error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Check for required environment variables
    email = os.environ.get('TIDAL_EMAIL')
    password = os.environ.get('TIDAL_PASSWORD')
    
    if not email or not password:
        logger.error("TIDAL_EMAIL and TIDAL_PASSWORD environment variables are required!")
        exit(1)
    
    logger.info("Starting TIDAL service...")
    app.run(host='0.0.0.0', port=5001, debug=False)