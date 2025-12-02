'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, Loader2, AlertCircle } from 'lucide-react';
import { streamingService, type LiveStream } from '@/services/streamingService';

interface StudentStreamViewerProps {
  streamId: string;
  onBack?: () => void;
}

export function StudentStreamViewer({ streamId, onBack }: StudentStreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    fetchStreamInfo();
    
    // Refresh viewer count periodically
    const interval = setInterval(() => {
      if (stream?.status === 'LIVE') {
        fetchStreamInfo();
      }
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(interval);
      if (joined) {
        leaveStream();
      }
      if (playerRef.current) {
        playerRef.current.delete();
      }
    };
  }, [streamId]);

  const fetchStreamInfo = async () => {
    try {
      // Use the new API to get stream status/details by session ID
      const statusResponse = await streamingService.getStreamStatus(streamId);
      
      if (statusResponse.success && statusResponse.data) {
        // Map the response to the local state structure
        // Note: We might need to adjust the state type if it's strictly LiveStream
        // For now, we'll map it to a compatible object
        setStream({
          id: streamId,
          title: 'Live Session', // Title might need to be fetched separately if not in status
          status: statusResponse.data.state === 'LIVE' ? 'LIVE' : 'ENDED',
          isActive: statusResponse.data.state === 'LIVE',
          channelArn: '', // Not needed for viewer
          ingestEndpoint: '', // Not needed for viewer
          playbackUrl: (statusResponse.data as any).playbackUrl || '', // Ensure playbackUrl is available
          viewerCount: statusResponse.data.viewerCount,
          createdAt: statusResponse.data.startTime || new Date().toISOString(),
          mentorProfile: { id: '', userId: '', user: { email: (statusResponse.data as any).mentorName || 'Mentor' } },
          course: (statusResponse.data as any).courseName ? {
            id: (statusResponse.data as any).courseId || '',
            courseName: (statusResponse.data as any).courseName || '',
          } : undefined,
        } as any);
      } else {
        setError('Stream is not active');
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stream:', err);
      setError('Failed to load stream. Please try again.');
      setLoading(false);
    }
  };

  const joinStream = async () => {
    if (!stream) return;
    
    try {
      // For the new flow, we might just need to track the viewer
      // The previous joinStream endpoint might still work if updated, or we can skip explicit join
      // But let's try to use the existing join endpoint if it's compatible or just proceed
      // Since we are just viewing, we can proceed to load the player
      setJoined(true);
      
      // Initialize IVS player
      if (typeof window !== 'undefined' && videoRef.current) {
        // Load IVS player script
        loadIVSPlayer();
      }
    } catch (err) {
      console.error('Failed to join stream:', err);
      setError('Failed to join stream. Please try again.');
    }
  };

  const leaveStream = async () => {
    try {
      // Just update local state
      setJoined(false);
      if (playerRef.current) {
        playerRef.current.delete();
        playerRef.current = null;
      }
    } catch (err) {
      console.error('Failed to leave stream:', err);
    }
  };

  const loadIVSPlayer = () => {
    // Check if IVS player script is already loaded
    if ((window as any).IVSPlayer) {
      initializePlayer();
      return;
    }

    // Load IVS player script
    const script = document.createElement('script');
    script.src = 'https://player.live-video.net/1.27.0/amazon-ivs-player.min.js';
    script.async = true;
    script.onload = () => {
      initializePlayer();
    };
    script.onerror = () => {
      setError('Failed to load video player. Please refresh the page.');
    };
    document.body.appendChild(script);
  };

  const initializePlayer = () => {
    if (!videoRef.current || !stream) return;

    const { IVSPlayer } = window as any;
    
    if (!IVSPlayer.isPlayerSupported) {
      setError('Your browser does not support the video player.');
      return;
    }

    try {
      const player = IVSPlayer.create();
      player.attachHTMLVideoElement(videoRef.current);
      player.load(stream.playbackUrl);
      player.play();
      
      // Event listeners
      player.addEventListener(IVSPlayer.PlayerState.READY, () => {
        setPlayerReady(true);
      });

      player.addEventListener(IVSPlayer.PlayerState.PLAYING, () => {
        setPlayerReady(true);
      });

      player.addEventListener(IVSPlayer.PlayerEventType.ERROR, (err: any) => {
        console.error('Player error:', err);
        setError('Error playing stream. The stream may have ended.');
      });

      playerRef.current = player;
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to initialize video player.');
    }
  };

  if (loading) {
    return (
      <Card className="bg-blue-900/30 border-blue-700/50">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stream) {
    return (
      <Card className="bg-blue-900/30 border-blue-700/50">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-white text-center">{error || 'Stream not found'}</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="border-blue-700 text-white">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-blue-900/30 border-blue-700/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-2xl">{stream.title}</CardTitle>
              {stream.description && (
                <CardDescription className="text-gray-300 mt-2">
                  {stream.description}
                </CardDescription>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Badge className={stream.status === 'LIVE' ? 'bg-red-500' : 'bg-gray-500'}>
                    {stream.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{stream.viewerCount} watching</span>
                </div>
              </div>
            </div>
            {onBack && (
              <Button onClick={onBack} variant="outline" size="sm" className="border-blue-700 text-white">
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stream.status !== 'LIVE' && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <p className="text-yellow-200 text-center">
                {stream.status === 'CREATED' 
                  ? 'Stream is scheduled but not yet live. Please check back later.'
                  : 'This stream has ended.'}
              </p>
            </div>
          )}

          {stream.status === 'LIVE' && !joined && (
            <div className="text-center py-8">
              <Button 
                onClick={joinStream}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Play className="mr-2 h-5 w-5" />
                Join Live Stream
              </Button>
            </div>
          )}

          {joined && (
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="w-full h-full"
                playsInline
                controls
              />
              {!playerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              )}
            </div>
          )}

          {/* Mentor Info */}
          {stream.mentorProfile.user && (
            <div className="flex items-center gap-3 p-4 bg-blue-950/50 rounded-lg">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {stream.mentorProfile.user.fullName?.[0] || stream.mentorProfile.user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">
                  {stream.mentorProfile.user.fullName || 'Mentor'}
                </p>
                <p className="text-gray-400 text-sm">Instructor</p>
              </div>
            </div>
          )}

          {/* Course Info */}
          {stream.course && (
            <div className="p-4 bg-blue-950/50 rounded-lg">
              <p className="text-gray-400 text-sm">Part of course:</p>
              <p className="text-white font-medium">{stream.course.courseName}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
