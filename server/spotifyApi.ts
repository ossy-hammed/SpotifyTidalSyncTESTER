export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    total: number;
    items: Array<{ track: SpotifyTrack }>;
  };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

export class SpotifyAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return this.makeRequest(`/playlists/${playlistId}`);
  }

  async getPlaylistTracks(playlistId: string, limit: number = 50, offset: number = 0): Promise<SpotifyTrack[]> {
    const response = await this.makeRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    return response.items.map((item: any) => item.track);
  }

  async getAllPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const batch = await this.getPlaylistTracks(playlistId, limit, offset);
      tracks.push(...batch);
      
      if (batch.length < limit) {
        break;
      }
      
      offset += limit;
    }

    return tracks;
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const response = await this.makeRequest('/me/playlists');
    return response.items;
  }

  static extractPlaylistId(url: string): string | null {
    // Handle various Spotify URL formats
    const patterns = [
      /spotify:playlist:([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]+)$/, // Direct playlist ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}

export async function getSpotifyAuthUrl(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/spotify/callback`;
  
  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-private',
    'user-read-email'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: 'code',
    redirect_uri: redirectUri!,
    scope: scopes,
    state: Math.random().toString(36).substring(7),
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/api/auth/spotify/callback`;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange Spotify code: ${response.statusText}`);
  }

  return response.json();
}
