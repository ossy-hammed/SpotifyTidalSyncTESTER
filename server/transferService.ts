import { SpotifyAPI, type SpotifyTrack } from './spotifyApi';
import { TidalAPI, type TidalTrack } from './tidalApi';
import { storage } from './storage';
import { EventEmitter } from 'events';

export interface TransferProgress {
  transferId: number;
  currentTrack: {
    name: string;
    artist: string;
    index: number;
  };
  completed: number;
  total: number;
  successful: number;
  partial: number;
  failed: number;
  percentage: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
}

export class TransferService extends EventEmitter {
  private activeTransfers = new Map<number, boolean>();

  async startTransfer(
    userId: string,
    spotifyPlaylistId: string,
    spotifyAccessToken: string
  ): Promise<number> {
    const spotifyApi = new SpotifyAPI(spotifyAccessToken);
    const tidalApi = new TidalAPI();

    try {
      // Get Spotify playlist details
      const spotifyPlaylist = await spotifyApi.getPlaylist(spotifyPlaylistId);
      const spotifyTracks = await spotifyApi.getAllPlaylistTracks(spotifyPlaylistId);

      // Create transfer record
      const transfer = await storage.createTransfer({
        userId,
        spotifyPlaylistId,
        spotifyPlaylistName: spotifyPlaylist.name,
        status: 'pending',
        totalTracks: spotifyTracks.length,
        progressData: {
          completed: 0,
          successful: 0,
          partial: 0,
          failed: 0,
        },
      });

      // Start the transfer process asynchronously
      this.processTransfer(transfer.id, spotifyPlaylist, spotifyTracks, tidalApi);

      return transfer.id;
    } catch (error) {
      console.error('Error starting transfer:', error);
      throw new Error('Failed to start transfer');
    }
  }

  private async processTransfer(
    transferId: number,
    spotifyPlaylist: any,
    spotifyTracks: SpotifyTrack[],
    tidalApi: TidalAPI
  ): Promise<void> {
    this.activeTransfers.set(transferId, true);

    try {
      // Update status to in-progress
      await storage.updateTransfer(transferId, { status: 'in-progress' });

      // Create TIDAL playlist
      const tidalPlaylist = await tidalApi.createPlaylist(
        spotifyPlaylist.name,
        `Converted from Spotify: ${spotifyPlaylist.description || ''}`
      );

      await storage.updateTransfer(transferId, {
        tidalPlaylistId: tidalPlaylist.uuid,
        tidalPlaylistName: tidalPlaylist.title,
      });

      let successful = 0;
      let partial = 0;
      let failed = 0;
      const successfulTrackIds: string[] = [];

      // Process each track
      for (let i = 0; i < spotifyTracks.length; i++) {
        // Check if transfer was cancelled
        if (!this.activeTransfers.get(transferId)) {
          await storage.updateTransfer(transferId, { status: 'cancelled' });
          return;
        }

        const spotifyTrack = spotifyTracks[i];
        
        // Emit progress update
        const progress: TransferProgress = {
          transferId,
          currentTrack: {
            name: spotifyTrack.name,
            artist: spotifyTrack.artists[0]?.name || 'Unknown Artist',
            index: i + 1,
          },
          completed: i,
          total: spotifyTracks.length,
          successful,
          partial,
          failed,
          percentage: Math.round((i / spotifyTracks.length) * 100),
          status: 'in-progress',
        };
        
        this.emit('progress', progress);

        try {
          // Search for track on TIDAL
          const matchResult = await tidalApi.findBestMatch(spotifyTrack);
          
          // Create track match record
          await storage.createTrackMatch({
            transferId,
            spotifyTrackId: spotifyTrack.id,
            spotifyTrackName: spotifyTrack.name,
            spotifyArtistName: spotifyTrack.artists[0]?.name || 'Unknown Artist',
            tidalTrackId: matchResult.track?.id || null,
            tidalTrackName: matchResult.track?.title || null,
            tidalArtistName: matchResult.track?.artist?.name || null,
            matchConfidence: matchResult.confidence,
            matchStatus: matchResult.status,
          });

          if (matchResult.status === 'success' && matchResult.track) {
            successfulTrackIds.push(matchResult.track.id);
            successful++;
            
            // Emit track added notification
            this.emit('trackAdded', {
              transferId,
              trackName: spotifyTrack.name,
              artistName: spotifyTrack.artists[0]?.name || 'Unknown Artist',
              status: 'success',
            });
          } else if (matchResult.status === 'partial' && matchResult.track) {
            successfulTrackIds.push(matchResult.track.id);
            partial++;
            
            this.emit('trackAdded', {
              transferId,
              trackName: spotifyTrack.name,
              artistName: spotifyTrack.artists[0]?.name || 'Unknown Artist',
              status: 'partial',
            });
          } else {
            failed++;
            
            this.emit('trackFailed', {
              transferId,
              trackName: spotifyTrack.name,
              artistName: spotifyTrack.artists[0]?.name || 'Unknown Artist',
            });
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error processing track ${spotifyTrack.name}:`, error);
          failed++;
          
          await storage.createTrackMatch({
            transferId,
            spotifyTrackId: spotifyTrack.id,
            spotifyTrackName: spotifyTrack.name,
            spotifyArtistName: spotifyTrack.artists[0]?.name || 'Unknown Artist',
            tidalTrackId: null,
            tidalTrackName: null,
            tidalArtistName: null,
            matchConfidence: 0,
            matchStatus: 'failed',
          });
        }
      }

      // Add successful tracks to TIDAL playlist in batches
      if (successfulTrackIds.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < successfulTrackIds.length; i += batchSize) {
          const batch = successfulTrackIds.slice(i, i + batchSize);
          await tidalApi.addTracksToPlaylist(tidalPlaylist.uuid, batch);
        }
      }

      // Update final transfer status
      await storage.updateTransfer(transferId, {
        status: 'completed',
        successfulTracks: successful,
        partialTracks: partial,
        failedTracks: failed,
        progressData: {
          completed: spotifyTracks.length,
          successful,
          partial,
          failed,
        } as any,
        resultData: {
          tidalPlaylistUrl: `https://tidal.com/browse/playlist/${tidalPlaylist.uuid}`,
          matchRate: Math.round((successful / spotifyTracks.length) * 100),
        } as any,
      });

      // Emit completion
      this.emit('completed', {
        transferId,
        successful,
        partial,
        failed,
        total: spotifyTracks.length,
        tidalPlaylistUrl: `https://tidal.com/browse/playlist/${tidalPlaylist.uuid}`,
      });

    } catch (error) {
      console.error(`Transfer ${transferId} failed:`, error);
      
      await storage.updateTransfer(transferId, {
        status: 'failed',
        resultData: { error: error instanceof Error ? error.message : 'Unknown error' } as any,
      });

      this.emit('failed', { transferId, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      this.activeTransfers.delete(transferId);
    }
  }

  async cancelTransfer(transferId: number): Promise<void> {
    this.activeTransfers.delete(transferId);
    await storage.updateTransfer(transferId, { status: 'cancelled' });
    this.emit('cancelled', { transferId });
  }

  async getTransferProgress(transferId: number): Promise<TransferProgress | null> {
    const transfer = await storage.getTransfer(transferId);
    if (!transfer) return null;

    const progressData = transfer.progressData as any || {};
    
    return {
      transferId,
      currentTrack: {
        name: progressData.currentTrack?.name || '',
        artist: progressData.currentTrack?.artist || '',
        index: progressData.completed || 0,
      },
      completed: progressData.completed || 0,
      total: transfer.totalTracks,
      successful: transfer.successfulTracks || 0,
      partial: transfer.partialTracks || 0,
      failed: transfer.failedTracks || 0,
      percentage: transfer.totalTracks > 0 ? Math.round(((progressData.completed || 0) / transfer.totalTracks) * 100) : 0,
      status: transfer.status as any,
    };
  }
}

export const transferService = new TransferService();
