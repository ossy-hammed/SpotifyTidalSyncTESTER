# Spotify to TIDAL Playlist Transfer

A web application that allows users to transfer their Spotify playlists to TIDAL with real-time progress tracking and OAuth authentication.

## Features

- OAuth authentication with Replit Auth
- Spotify playlist import via URL
- Automatic track matching between Spotify and TIDAL
- Real-time transfer progress with WebSocket updates
- Transfer history and results tracking
- Responsive web interface with dark/light mode support

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + shadcn/ui components
- TanStack Query for data fetching
- Socket.io for real-time updates
- Wouter for routing

### Backend
- Node.js with Express
- TypeScript
- Socket.io for WebSocket communication
- Drizzle ORM with PostgreSQL
- Replit Auth for authentication

### External Services
- Python service for TIDAL API integration
- Spotify Web API
- TIDAL API (via Python service)

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
├── server/                # Backend Express server
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── spotifyApi.ts      # Spotify API integration
│   ├── tidalApi.ts        # TIDAL API integration
│   └── transferService.ts # Transfer logic
├── python_service/        # Python service for TIDAL
│   └── tidal_service.py   # TIDAL API wrapper
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema
└── package.json           # Dependencies and scripts
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (contact support for API keys):
   - DATABASE_URL (PostgreSQL connection string)
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET
   - TIDAL credentials (configured in Python service)

3. Run database migrations:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at the provided Replit URL.

## API Endpoints

- `GET /api/auth/user` - Get current user
- `GET /api/auth/spotify` - Spotify OAuth URL
- `GET /api/auth/spotify/callback` - Spotify OAuth callback
- `GET /api/tidal/health` - TIDAL service health check
- `POST /api/transfers` - Start playlist transfer
- `GET /api/transfers` - Get user transfers
- `GET /api/transfers/:id` - Get transfer details
- `POST /api/transfers/:id/cancel` - Cancel transfer

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for type safety
3. Update tests when adding new features
4. Ensure all API endpoints are properly authenticated

## License

Private project - All rights reserved# SpotifyTidalSync
