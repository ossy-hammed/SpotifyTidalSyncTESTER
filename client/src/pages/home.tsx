import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import AuthSection from "@/components/auth/auth-section";
import ImportSection from "@/components/playlist/import-section";
import RecentTransfers from "@/components/transfer/recent-transfers";

export default function Home() {
  const { toast } = useToast();

  useEffect(() => {
    // Check for auth callback status
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('spotify') === 'connected') {
      toast({
        title: "Spotify Connected",
        description: "Your Spotify account has been successfully connected.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
    
    if (urlParams.get('tidal') === 'connected') {
      toast({
        title: "TIDAL Connected", 
        description: "Your TIDAL account has been successfully connected.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }

    if (urlParams.get('spotify') === 'error') {
      toast({
        title: "Spotify Connection Failed",
        description: "There was an error connecting your Spotify account. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/');
    }

    if (urlParams.get('tidal') === 'error') {
      toast({
        title: "TIDAL Connection Failed",
        description: "There was an error connecting your TIDAL account. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/');
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Transfer Your Music Seamlessly</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Connect your Spotify and TIDAL accounts to start transferring your favorite playlists in just a few clicks.
          </p>
        </div>

        <AuthSection />
        <ImportSection />
        <RecentTransfers />
      </main>
    </div>
  );
}
