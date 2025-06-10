import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TransferResultsProps {
  transferId: number;
  onStartNew: () => void;
}

export default function TransferResults({ transferId, onStartNew }: TransferResultsProps) {
  const { toast } = useToast();

  const { data: transfer, isLoading } = useQuery({
    queryKey: ["/api/transfers", transferId],
  });

  const { data: matches } = useQuery({
    queryKey: ["/api/transfers", transferId, "matches"],
  });

  const handleOpenTidalPlaylist = () => {
    if (transfer?.resultData?.tidalPlaylistUrl) {
      window.open(transfer.resultData.tidalPlaylistUrl, '_blank');
    }
  };

  const handleCopyTidalLink = async () => {
    if (transfer?.resultData?.tidalPlaylistUrl) {
      try {
        await navigator.clipboard.writeText(transfer.resultData.tidalPlaylistUrl);
        toast({
          title: "Link Copied",
          description: "TIDAL playlist link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadReport = () => {
    if (!matches || !transfer) return;

    const report = {
      transfer: {
        playlist: transfer.spotifyPlaylistName,
        date: new Date(transfer.createdAt).toISOString(),
        total: transfer.totalTracks,
        successful: transfer.successfulTracks,
        partial: transfer.partialTracks,
        failed: transfer.failedTracks,
      },
      tracks: matches.map((match: any) => ({
        spotify: {
          name: match.spotifyTrackName,
          artist: match.spotifyArtistName,
        },
        tidal: {
          name: match.tidalTrackName,
          artist: match.tidalArtistName,
        },
        status: match.matchStatus,
        confidence: match.matchConfidence,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfer-report-${transfer.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Transfer report has been downloaded",
    });
  };

  if (isLoading || !transfer) {
    return (
      <Card className="bg-dark-card border-gray-800">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4 w-48 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded mb-8 w-64 mx-auto"></div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const matchRate = transfer.totalTracks > 0 
    ? Math.round((transfer.successfulTracks / transfer.totalTracks) * 100)
    : 0;

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-white text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold mb-2">Transfer Complete!</h3>
          <p className="text-gray-400">Your playlist has been successfully transferred to TIDAL</p>
        </div>

        {/* Results Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">{transfer.successfulTracks}</div>
            <div className="text-sm text-gray-400">Successfully Added</div>
            <div className="text-xs text-green-400 mt-1">{matchRate}% match rate</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">{transfer.partialTracks}</div>
            <div className="text-sm text-gray-400">Partial Matches</div>
            <div className="text-xs text-yellow-400 mt-1">Similar versions found</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">{transfer.failedTracks}</div>
            <div className="text-sm text-gray-400">Not Found</div>
            <div className="text-xs text-red-400 mt-1">Not available on TIDAL</div>
          </div>
        </div>

        {/* TIDAL Playlist Link */}
        {transfer.tidalPlaylistName && (
          <div className="bg-tidal/10 border border-tidal/20 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-tidal rounded-xl flex items-center justify-center">
                  <i className="fas fa-wave-square text-white"></i>
                </div>
                <div>
                  <h4 className="font-semibold">{transfer.tidalPlaylistName}</h4>
                  <p className="text-sm text-gray-400">
                    Created on TIDAL • {transfer.successfulTracks + transfer.partialTracks} tracks
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {transfer.resultData?.tidalPlaylistUrl && (
                  <>
                    <Button
                      onClick={handleOpenTidalPlaylist}
                      className="bg-tidal text-white px-4 py-2 rounded-lg font-medium hover:bg-tidal/90 transition-colors"
                    >
                      Open in TIDAL
                    </Button>
                    <Button
                      onClick={handleCopyTidalLink}
                      variant="secondary"
                      className="bg-dark-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={onStartNew}
            className="bg-gradient-to-r from-spotify to-tidal text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Transfer Another Playlist
          </Button>
          <Button
            onClick={handleDownloadReport}
            variant="secondary"
            className="bg-dark-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Download Transfer Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
