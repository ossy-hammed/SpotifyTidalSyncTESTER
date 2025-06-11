import { useQuery, useMutation } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";

export default function AuthSection() {
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const spotifyAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/spotify", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive",
      });
    },
  });

  const tidalAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/tidal", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connected",
        description: "TIDAL connected successfully!",
      });
      // Refresh user data to update connection status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Connection Failed",
        description: "Failed to connect to TIDAL. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="mb-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Spotify Auth Card */}
        <Card className="bg-dark-card border-gray-800 hover:border-spotify/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-spotify rounded-xl flex items-center justify-center">
                  <i className="fab fa-spotify text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold">Spotify</h3>
                  <p className="text-sm text-gray-400">Source Platform</p>
                </div>
              </div>
              <div className="flex items-center">
                <i className={`fas fa-circle text-sm mr-2 ${user?.spotifyConnected ? 'text-green-500' : 'text-red-500'}`}></i>
                <span className="text-sm text-gray-400">
                  {user?.spotifyConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
              <Button
                onClick={() => spotifyAuthMutation.mutate()}
                disabled={spotifyAuthMutation.isPending || !!user?.spotifyConnected}
              className="w-full bg-spotify text-white py-3 rounded-lg font-medium hover:bg-spotify/90 transition-colors disabled:opacity-50"
            >
              {spotifyAuthMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Connecting...
                </>
              ) : user?.spotifyConnected ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Connected
                </>
              ) : (
                'Connect Spotify'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* TIDAL Auth Card */}
        <Card className="bg-dark-card border-gray-800 hover:border-tidal/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-tidal rounded-xl flex items-center justify-center">
                  <i className="fas fa-wave-square text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold">TIDAL</h3>
                  <p className="text-sm text-gray-400">Destination Platform</p>
                </div>
              </div>
              <div className="flex items-center">
                <i className={`fas fa-circle text-sm mr-2 ${user?.tidalConnected ? 'text-green-500' : 'text-red-500'}`}></i>
                <span className="text-sm text-gray-400">
                  {user?.tidalConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
              <Button
                onClick={() => tidalAuthMutation.mutate()}
                disabled={tidalAuthMutation.isPending || !!user?.tidalConnected}
              className="w-full bg-tidal text-white py-3 rounded-lg font-medium hover:bg-tidal/90 transition-colors disabled:opacity-50"
            >
              {tidalAuthMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Connecting...
                </>
              ) : user?.tidalConnected ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Connected
                </>
              ) : (
                'Connect TIDAL'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
