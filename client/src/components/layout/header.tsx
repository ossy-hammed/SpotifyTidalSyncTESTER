import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { isAuthenticated, user } = useAuth();

  const handleAuth = () => {
    if (isAuthenticated) {
      window.location.href = "/api/logout";
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <header className="bg-dark-card border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-spotify to-tidal rounded-lg flex items-center justify-center">
              <i className="fas fa-music text-white"></i>
            </div>
            <h1 className="text-xl font-bold">Playlist Converter</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-3 h-3 bg-spotify rounded-full"></div>
              <span>Spotify</span>
              <i className="fas fa-arrow-right text-gray-500"></i>
              <div className="w-3 h-3 bg-tidal rounded-full"></div>
              <span>TIDAL</span>
            </div>
            <Button 
              onClick={handleAuth}
              className="bg-gradient-to-r from-spotify to-tidal text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {isAuthenticated ? "Sign Out" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
