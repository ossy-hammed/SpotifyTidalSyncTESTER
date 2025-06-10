import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-spotify to-tidal rounded-2xl flex items-center justify-center mx-auto mb-8">
            <i className="fas fa-music text-white text-3xl"></i>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-spotify to-tidal bg-clip-text text-transparent">
            Transfer Your Music Seamlessly
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Convert your Spotify playlists to TIDAL with intelligent track matching, 
            real-time progress tracking, and detailed transfer reports.
          </p>
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-4">
              First, create your free account. Then connect Spotify & TIDAL to start transferring.
            </p>
            <Button 
              onClick={handleLogin}
              className="bg-gradient-to-r from-spotify to-tidal text-white px-8 py-4 text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Create Free Account
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-spotify/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fab fa-spotify text-spotify text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Your Accounts</h3>
              <p className="text-gray-400">
                Securely link your Spotify and TIDAL accounts with OAuth authentication for seamless playlist access.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-search text-blue-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Track Matching</h3>
              <p className="text-gray-400">
                Advanced algorithms find the best matches for your tracks on TIDAL with confidence scoring.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-tidal/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-wave-square text-tidal text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Progress</h3>
              <p className="text-gray-400">
                Watch your playlists transfer in real-time with detailed progress tracking and instant notifications.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-dark-card rounded-2xl p-12 border border-gray-800">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-spotify rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Sign In</h4>
                <p className="text-sm text-gray-400">Connect your accounts</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Import</h4>
                <p className="text-sm text-gray-400">Select Spotify playlist</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Transfer</h4>
                <p className="text-sm text-gray-400">Watch the magic happen</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-tidal rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Enjoy</h4>
                <p className="text-sm text-gray-400">Listen on TIDAL</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
