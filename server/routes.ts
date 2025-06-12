import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from 'socket.io';
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { SpotifyAPI, getSpotifyAuthUrl, exchangeSpotifyCode } from "./spotifyApi";
import { TidalAPI } from "./tidalApi";
import { transferService } from "./transferService";
import { insertTransferSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('joinTransfer', (transferId: number) => {
      socket.join(`transfer-${transferId}`);
    });
  });

  // Transfer service event handlers
  transferService.on('progress', (progress) => {
    io.to(`transfer-${progress.transferId}`).emit('transferProgress', progress);
  });

  transferService.on('trackAdded', (data) => {
    io.to(`transfer-${data.transferId}`).emit('trackAdded', data);
  });

  transferService.on('trackFailed', (data) => {
    io.to(`transfer-${data.transferId}`).emit('trackFailed', data);
  });

  transferService.on('completed', (data) => {
    io.to(`transfer-${data.transferId}`).emit('transferCompleted', data);
  });

  transferService.on('failed', (data) => {
    io.to(`transfer-${data.transferId}`).emit('transferFailed', data);
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Spotify auth routes
  app.get('/api/auth/spotify', isAuthenticated, async (req, res) => {
    try {
      const authUrl = await getSpotifyAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error getting Spotify auth URL:', error);
      res.status(500).json({ message: 'Failed to get Spotify auth URL' });
    }
  });

  app.get('/api/auth/spotify/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Authorization code required' });
      }

      const tokens = await exchangeSpotifyCode(code as string);
      const userId = req.user.claims.sub;
      
      await storage.updateSpotifyConnection(userId, tokens.access_token, tokens.refresh_token);
      
      res.redirect('/?spotify=connected');
    } catch (error) {
      console.error('Error in Spotify callback:', error);
      res.redirect('/?spotify=error');
    }
  });

  // TIDAL auth routes
  app.get('/api/auth/tidal', isAuthenticated, async (req, res) => {
    try {
      // For now, we'll simulate TIDAL auth by checking if the service is available
      // and marking the user as connected if it is
      const health = await TidalAPI.checkHealth();
      if (health.status === 'ok') {
        const userId = (req as any).user.claims.sub;
        await storage.updateTidalConnection(userId, true);
        res.json({ success: true, message: 'TIDAL connected successfully' });
      } else {
        res.status(500).json({ message: 'TIDAL service unavailable' });
      }
    } catch (error) {
      console.error('TIDAL connection failed:', error);
      res.status(500).json({ message: 'Failed to connect to TIDAL' });
    }
  });

  // TIDAL health check route
  app.get('/api/tidal/health', isAuthenticated, async (req, res) => {
    try {
      const health = await TidalAPI.checkHealth();
      res.json(health);
    } catch (error) {
      console.error('TIDAL service health check failed:', error);
      res.status(500).json({ message: 'TIDAL service unavailable' });
    }
  });

  // Playlist routes
  app.get('/api/spotify/playlist/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.spotifyAccessToken) {
        return res.status(400).json({ message: 'Spotify not connected' });
      }

      const spotifyApi = new SpotifyAPI(user.spotifyAccessToken);
      const playlist = await spotifyApi.getPlaylist(req.params.id);
      
      res.json(playlist);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      res.status(500).json({ message: 'Failed to fetch playlist' });
    }
  });

  app.get('/api/spotify/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.spotifyAccessToken) {
        return res.status(400).json({ message: 'Spotify not connected' });
      }

      const spotifyApi = new SpotifyAPI(user.spotifyAccessToken);
      const playlists = await spotifyApi.getUserPlaylists();
      
      res.json(playlists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ message: 'Failed to fetch playlists' });
    }
  });

  // Transfer routes
  app.post('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { spotifyPlaylistUrl } = req.body;
      
      if (!spotifyPlaylistUrl) {
        return res.status(400).json({ message: 'Spotify playlist URL required' });
      }

      const playlistId = SpotifyAPI.extractPlaylistId(spotifyPlaylistUrl);
      if (!playlistId) {
        return res.status(400).json({ message: 'Invalid Spotify playlist URL' });
      }

      const user = await storage.getUser(userId);
      if (!user?.spotifyAccessToken) {
        return res.status(400).json({ message: 'Spotify must be connected' });
      }

      // Check if TIDAL service is available
      try {
        await TidalAPI.checkHealth();
      } catch (error) {
        return res.status(500).json({ message: 'TIDAL service is not available. Please contact support.' });
      }

      const transferId = await transferService.startTransfer(
        userId,
        playlistId,
        user.spotifyAccessToken
      );

      res.json({ transferId });
    } catch (error) {
      console.error('Error starting transfer:', error);
      res.status(500).json({ message: 'Failed to start transfer' });
    }
  });

  app.get('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transfers = await storage.getUserTransfers(userId);
      res.json(transfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      res.status(500).json({ message: 'Failed to fetch transfers' });
    }
  });

  app.get('/api/transfers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const transferId = parseInt(req.params.id);
      const transfer = await storage.getTransfer(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: 'Transfer not found' });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (transfer.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(transfer);
    } catch (error) {
      console.error('Error fetching transfer:', error);
      res.status(500).json({ message: 'Failed to fetch transfer' });
    }
  });

  app.post('/api/transfers/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const transferId = parseInt(req.params.id);
      const transfer = await storage.getTransfer(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: 'Transfer not found' });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (transfer.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await transferService.cancelTransfer(transferId);
      res.json({ message: 'Transfer cancelled' });
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      res.status(500).json({ message: 'Failed to cancel transfer' });
    }
  });

  app.get('/api/transfers/:id/matches', isAuthenticated, async (req: any, res) => {
    try {
      const transferId = parseInt(req.params.id);
      const transfer = await storage.getTransfer(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: 'Transfer not found' });
      }

      // Verify ownership
      const userId = req.user.claims.sub;
      if (transfer.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const matches = await storage.getTransferMatches(transferId);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching transfer matches:', error);
      res.status(500).json({ message: 'Failed to fetch transfer matches' });
    }
  });

  return httpServer;
}
