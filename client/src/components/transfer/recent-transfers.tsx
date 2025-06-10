import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RecentTransfers() {
  const { data: transfers, isLoading } = useQuery({
    queryKey: ["/api/transfers"],
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getGradientColors = (index: number) => {
    const gradients = [
      'from-purple-500 to-blue-500',
      'from-red-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <h3 className="text-2xl font-semibold mb-6">Recent Transfers</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-dark-card border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <div className="h-4 w-8 bg-gray-700 rounded"></div>
                      <div className="h-4 w-8 bg-gray-700 rounded"></div>
                      <div className="h-4 w-8 bg-gray-700 rounded"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="mb-12">
        <h3 className="text-2xl font-semibold mb-6">Recent Transfers</h3>
        <Card className="bg-dark-card border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-history text-gray-400 text-xl"></i>
            </div>
            <h4 className="text-lg font-semibold mb-2">No transfers yet</h4>
            <p className="text-gray-400">
              Once you transfer your first playlist, it will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-semibold mb-6">Recent Transfers</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transfers.slice(0, 6).map((transfer: any, index: number) => (
          <Card key={transfer.id} className="bg-dark-card border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${getGradientColors(index)} rounded`}></div>
                <div className="flex-1">
                  <h4 className="font-medium truncate">{transfer.spotifyPlaylistName}</h4>
                  <p className="text-sm text-gray-400">{formatTimeAgo(transfer.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-green-500">{transfer.successfulTracks || 0}</span>
                  <span className="text-yellow-500">{transfer.partialTracks || 0}</span>
                  <span className="text-red-500">{transfer.failedTracks || 0}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {transfer.status === 'completed' && (
                    <i className="fas fa-check-circle text-green-500"></i>
                  )}
                  {transfer.status === 'in-progress' && (
                    <i className="fas fa-spinner animate-spin text-blue-500"></i>
                  )}
                  {transfer.status === 'failed' && (
                    <i className="fas fa-exclamation-circle text-red-500"></i>
                  )}
                  {transfer.status === 'cancelled' && (
                    <i className="fas fa-times-circle text-gray-500"></i>
                  )}
                  
                  {transfer.resultData?.tidalPlaylistUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(transfer.resultData.tidalPlaylistUrl, '_blank')}
                      className="text-tidal hover:text-tidal/80 p-1"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </Button>
                  )}
                </div>
              </div>

              {transfer.status === 'in-progress' && (
                <div className="mt-3">
                  <div className="w-full bg-dark-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-spotify to-tidal h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${transfer.totalTracks > 0 ? Math.round(((transfer.successfulTracks + transfer.partialTracks + transfer.failedTracks) / transfer.totalTracks) * 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
