import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Transfer } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";

interface TransferProgressProps {
  transferId: number;
  onComplete: () => void;
  onCancel: () => void;
}

interface ProgressData {
  transferId: number;
  currentTrack: {
    name: string;
    artist: string;
    index: number;
  };
  completed: number;
  total: number;
  successful: number;
  partial: number;
  failed: number;
  percentage: number;
  status: string;
}

export default function TransferProgress({ transferId, onComplete, onCancel }: TransferProgressProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const { toast } = useToast();

  const { data: transfer } = useQuery<Transfer>({
    queryKey: ["/api/transfers", transferId],
    refetchInterval: 5000, // Fallback polling
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/transfers/${transferId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Cancelled",
        description: "The transfer has been cancelled successfully.",
      });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Cancel Failed",
        description: error instanceof Error ? error.message : "Failed to cancel transfer",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Join transfer room
    newSocket.emit('joinTransfer', transferId);

    // Listen for progress updates
    newSocket.on('transferProgress', (data: ProgressData) => {
      setProgress(data);
    });

    // Listen for track events
    newSocket.on('trackAdded', (data: any) => {
      toast({
        title: "Track Added",
        description: `"${data.trackName}" by ${data.artistName} added to TIDAL playlist`,
        duration: 3000,
      });
    });

    newSocket.on('trackFailed', (data: any) => {
      toast({
        title: "Track Not Found",
        description: `"${data.trackName}" by ${data.artistName} could not be found on TIDAL`,
        variant: "destructive",
        duration: 3000,
      });
    });

    newSocket.on('transferCompleted', (data: any) => {
      toast({
        title: "Transfer Complete!",
        description: `Successfully transferred ${data.successful} tracks to TIDAL`,
      });
      onComplete();
    });

    newSocket.on('transferFailed', (data: any) => {
      toast({
        title: "Transfer Failed",
        description: data.error || "The transfer failed unexpectedly",
        variant: "destructive",
      });
      onCancel();
    });

    return () => {
      newSocket.close();
    };
  }, [transferId, toast, onComplete, onCancel]);

  const currentProgress = progress || {
    transferId,
    currentTrack: { name: "", artist: "", index: 0 },
    completed: 0,
    total: transfer?.totalTracks || 0,
    successful: transfer?.successfulTracks || 0,
    partial: transfer?.partialTracks || 0,
    failed: transfer?.failedTracks || 0,
    percentage: 0,
    status: transfer?.status || "pending",
  };

  const timeRemaining = currentProgress.total > 0 && currentProgress.completed > 0 
    ? Math.ceil(((currentProgress.total - currentProgress.completed) * 2)) // Estimate 2 seconds per track
    : null;

  return (
    <Card className="bg-dark-card border-gray-800">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold">Transfer Progress</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">
              {currentProgress.status === "in-progress" ? "Transferring..." : "Processing..."}
            </span>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-400">{currentProgress.percentage}%</span>
          </div>
          <Progress value={currentProgress.percentage} className="h-3 mb-2" />
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{currentProgress.completed} of {currentProgress.total} tracks</span>
            {timeRemaining && (
              <span>~{Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s remaining</span>
            )}
          </div>
        </div>

        {/* Current Track Being Processed */}
        {currentProgress.currentTrack.name && (
          <div className="bg-dark-secondary/50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded animate-pulse"></div>
              <div className="flex-1">
                <p className="font-medium">Searching for "{currentProgress.currentTrack.name}"</p>
                <p className="text-sm text-gray-400">by {currentProgress.currentTrack.artist}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <i className="fas fa-search text-blue-500 animate-spin"></i>
                  <span className="text-sm">Searching TIDAL...</span>
                </div>
                <div className="text-xs text-gray-500">Track {currentProgress.currentTrack.index} of {currentProgress.total}</div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{currentProgress.successful}</div>
            <div className="text-xs text-gray-400">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{currentProgress.partial}</div>
            <div className="text-xs text-gray-400">Partial Match</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{currentProgress.failed}</div>
            <div className="text-xs text-gray-400">Not Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{currentProgress.total - currentProgress.completed}</div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending || currentProgress.status !== "in-progress"}
            variant="destructive"
            className="px-4 py-2"
          >
            {cancelMutation.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Cancelling...
              </>
            ) : (
              <>
                <i className="fas fa-stop mr-2"></i>
                Cancel Transfer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
