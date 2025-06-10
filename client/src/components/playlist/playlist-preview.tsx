import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PlaylistPreviewProps {
  playlist: any;
  onStartTransfer: () => void;
  canTransfer: boolean;
  isTransferring: boolean;
}

export default function PlaylistPreview({ 
  playlist, 
  onStartTransfer, 
  canTransfer, 
  isTransferring 
}: PlaylistPreviewProps) {
  const formatDuration = (totalMs: number) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalDuration = playlist.tracks.items.reduce((acc: number, item: any) => 
    acc + (item.track?.duration_ms || 0), 0
  );

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardContent className="p-8">
        <div className="flex items-start space-x-6 mb-6">
          {/* Playlist Image or Placeholder */}
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
            {playlist.images?.[0] ? (
              <img 
                src={playlist.images[0].url} 
                alt={playlist.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <i className="fas fa-music text-white text-3xl"></i>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{playlist.name}</h3>
            <p className="text-gray-400 mb-4">{playlist.description || "No description"}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>{playlist.tracks.total} tracks</span>
              <span>{formatDuration(totalDuration)}</span>
              <span>by {playlist.owner.display_name}</span>
            </div>
          </div>
          
          <Button
            onClick={onStartTransfer}
            disabled={!canTransfer || isTransferring}
            className="bg-gradient-to-r from-spotify to-tidal text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isTransferring ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Starting Transfer...
              </>
            ) : (
              <>
                <i className="fas fa-arrow-right mr-2"></i>
                Transfer to TIDAL
              </>
            )}
          </Button>
        </div>

        {!canTransfer && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-yellow-500">
              <i className="fas fa-exclamation-triangle"></i>
              <span className="font-medium">Both Spotify and TIDAL accounts must be connected to start transfer</span>
            </div>
          </div>
        )}

        {/* Track List Preview */}
        <div className="space-y-2">
          <h4 className="font-semibold text-lg mb-4">Track Preview</h4>
          {playlist.tracks.items.slice(0, 5).map((item: any, index: number) => {
            const track = item.track;
            if (!track) return null;
            
            return (
              <div key={track.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-dark-secondary/50 transition-colors">
                <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
                  {index + 1}
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex-shrink-0">
                  {track.album?.images?.[0] ? (
                    <img 
                      src={track.album.images[0].url} 
                      alt={track.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : null}
                </div>
                
                <div className="flex-1">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-gray-400 truncate">
                    {track.artists.map((artist: any) => artist.name).join(", ")}
                  </p>
                </div>
                
                <div className="text-sm text-gray-400">
                  {Math.floor(track.duration_ms / 60000)}:{Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}
                </div>
                
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="fas fa-check text-green-500"></i>
                </div>
              </div>
            );
          })}
          
          {playlist.tracks.total > 5 && (
            <div className="text-center pt-4">
              <span className="text-spotify text-sm font-medium">
                +{playlist.tracks.total - 5} more tracks
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
