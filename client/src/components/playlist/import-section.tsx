import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";
import PlaylistPreview from "./playlist-preview";
import TransferProgress from "../transfer/transfer-progress";
import TransferResults from "../transfer/transfer-results";

export default function ImportSection() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [currentTransfer, setCurrentTransfer] = useState<number | null>(null);
  const [transferStatus, setTransferStatus] = useState<string>("");
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const playlistMutation = useMutation({
    mutationFn: async (url: string) => {
      // Extract playlist ID from URL
      const patterns = [
        /spotify:playlist:([a-zA-Z0-9]+)/,
        /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
        /^([a-zA-Z0-9]+)$/, // Direct playlist ID
      ];

      let playlistId = null;
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          playlistId = match[1];
          break;
        }
      }

      if (!playlistId) {
        throw new Error("Invalid Spotify playlist URL");
      }

      const response = await fetch(`/api/spotify/playlist/${playlistId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentPlaylist(data);
      toast({
        title: "Playlist Loaded",
        description: `Successfully loaded "${data.name}" with ${data.tracks.total} tracks.`,
      });
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
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import playlist",
        variant: "destructive",
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (spotifyPlaylistUrl: string) => {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ spotifyPlaylistUrl }),
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentTransfer(data.transferId);
      setTransferStatus("in-progress");
      toast({
        title: "Transfer Started",
        description: "Your playlist transfer has begun. You can track the progress below.",
      });
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
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to start transfer",
        variant: "destructive",
      });
    },
  });

  const handleImportPlaylist = () => {
    if (!playlistUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a Spotify playlist URL.",
        variant: "destructive",
      });
      return;
    }

    playlistMutation.mutate(playlistUrl.trim());
  };

  const handleStartTransfer = () => {
    if (!currentPlaylist) return;

    if (!user?.spotifyConnected || !user?.tidalConnected) {
      toast({
        title: "Accounts Required",
        description: "Please connect both Spotify and TIDAL accounts before transferring.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate(playlistUrl);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPlaylistUrl(text);
    } catch (error) {
      toast({
        title: "Clipboard Error",
        description: "Failed to read from clipboard. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  const canTransfer = !!(user?.spotifyConnected && user?.tidalConnected);

  // Show transfer results if completed
  if (transferStatus === "completed" && currentTransfer) {
    return <TransferResults transferId={currentTransfer} onStartNew={() => {
      setCurrentTransfer(null);
      setTransferStatus("");
      setCurrentPlaylist(null);
      setPlaylistUrl("");
    }} />;
  }

  // Show transfer progress if in progress
  if (currentTransfer && transferStatus === "in-progress") {
    return <TransferProgress 
      transferId={currentTransfer} 
      onComplete={() => setTransferStatus("completed")}
      onCancel={() => {
        setCurrentTransfer(null);
        setTransferStatus("");
      }}
    />;
  }

  return (
    <div className="mb-12">
      <Card className="bg-dark-card border-gray-800 mb-8">
        <CardContent className="p-8">
          <h3 className="text-2xl font-semibold mb-6">Import Spotify Playlist</h3>
          
          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-medium mb-2">Playlist URL or URI</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full bg-dark-secondary border-gray-700 pr-12 text-white placeholder-gray-500 focus:border-spotify focus:ring-spotify"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  <i className="fas fa-paste"></i>
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports Spotify playlist URLs, URIs, and direct links</p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleImportPlaylist}
                disabled={playlistMutation.isPending || !user?.spotifyConnected}
                className="bg-gradient-to-r from-spotify to-tidal text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {playlistMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Importing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Import Playlist
                  </>
                )}
              </Button>
              
              {!user?.spotifyConnected && (
                <p className="text-sm text-yellow-500">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Connect Spotify first
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {currentPlaylist && (
        <PlaylistPreview 
          playlist={currentPlaylist} 
          onStartTransfer={handleStartTransfer}
          canTransfer={canTransfer}
          isTransferring={transferMutation.isPending}
        />
      )}
    </div>
  );
}
