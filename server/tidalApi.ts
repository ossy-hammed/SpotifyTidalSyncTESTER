export interface TidalTrack {
  id: string;
  title: string;
  artist: { name: string };
  artists: Array<{ name: string }>;
  duration: number;
  url: string;
}

export interface TidalPlaylist {
  uuid: string;
  title: string;
  description: string;
  numberOfTracks: number;
  url: string;
}

export interface TidalSearchResult {
  tracks: {
    items: TidalTrack[];
    totalNumberOfItems: number;
  };
}

export class TidalAPI {
  private static PYTHON_SERVICE_URL = 'http://localhost:5001';

  constructor() {
    // No longer need access token - using Python service with credentials
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const response = await fetch(`${TidalAPI.PYTHON_SERVICE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`TIDAL service error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchTrack(query: string, limit: number = 10): Promise<TidalTrack[]> {
    const response: TidalSearchResult = await this.makeRequest('/search', 'POST', {
      query,
      limit
    });
    return response.tracks.items;
  }

  async createPlaylist(title: string, description?: string): Promise<TidalPlaylist> {
    return this.makeRequest('/create-playlist', 'POST', {
      title,
      description: description || '',
    });
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
    await this.makeRequest('/add-tracks-to-playlist', 'POST', {
      playlist_id: playlistId,
      track_ids: trackIds,
    });
  }

  async findBestMatch(spotifyTrack: { name: string; artists: Array<{ name: string }> }): Promise<{
    track: TidalTrack | null;
    confidence: number;
    status: 'success' | 'partial' | 'failed';
  }> {
    return this.makeRequest('/find-best-match', 'POST', {
      spotify_track: spotifyTrack
    });
  }

  static async checkHealth(): Promise<{ status: string; user?: string }> {
    try {
      const response = await fetch(`${TidalAPI.PYTHON_SERVICE_URL}/health`);
      return response.json();
    } catch (error) {
      throw new Error('TIDAL service is not available');
    }
  }
}
