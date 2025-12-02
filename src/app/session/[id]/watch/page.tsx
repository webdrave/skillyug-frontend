'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { sessionService } from '@/services/sessionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, Loader2, Video, Radio } from 'lucide-react';

// Window.IVSPlayer type is declared in @/types/ivs-player.d.ts

interface StreamData {
  playbackUrl: string;
  sessionId: string;
  title: string;
}

export default function WatchSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const sessionId = params?.id as string;

  useEffect(() => {
    // Load Amazon IVS Player SDK
    const script = document.createElement('script');
    script.src = 'https://player.live-video.net/1.6.0/amazon-ivs-player.min.js';
    script.async = true;
    script.onload = () => {
      console.log('IVS Player SDK loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load video player. Please refresh the page.');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup player on unmount
      if (playerRef.current) {
        playerRef.current.delete();
        playerRef.current = null;
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session && sessionId) {
      loadSession();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, sessionId, status, router]);

  useEffect(() => {
    if (scriptLoaded && streamData?.playbackUrl && videoRef.current) {
      initializePlayer(streamData.playbackUrl);
    }
  }, [scriptLoaded, streamData]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the joinSession from sessionService
      const response = await sessionService.joinSession(sessionId);
      
      if (response.playbackUrl) {
        setStreamData({
          playbackUrl: response.playbackUrl,
          sessionId: response.sessionId,
          title: response.title,
        });
      } else {
        setError('Session is not live yet. Please wait for the mentor to start streaming.');
      }
    } catch (err: any) {
      console.error('Failed to load session:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to join session';
      
      if (errorMsg.includes('not started')) {
        setError('Session has not started yet. Please wait for the mentor to begin streaming.');
      } else if (errorMsg.includes('not enrolled')) {
        setError('You are not enrolled in this course. Please enroll to watch this session.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = (playbackUrl: string) => {
    try {
      const { IVSPlayer } = window;
      
      if (!IVSPlayer) {
        setError('Video player not available. Please refresh the page.');
        return;
      }

      if (!IVSPlayer.isPlayerSupported) {
        setError('Your browser does not support the video player. Please use a modern browser.');
        return;
      }

      // Create player instance
      const player = IVSPlayer.create();
      playerRef.current = player;

      // Attach to video element (with null check)
      if (videoRef.current) {
        player.attachHTMLVideoElement(videoRef.current);
      }

      // Event listeners
      player.addEventListener(IVSPlayer.PlayerState.READY, () => {
        console.log('Player is ready');
        setPlayerReady(true);
      });

      player.addEventListener(IVSPlayer.PlayerState.PLAYING, () => {
        console.log('Stream is playing');
      });

      player.addEventListener(IVSPlayer.PlayerEventType.ERROR, (error: any) => {
        console.error('Player error:', error);
        setError('Error playing stream. The stream may have ended or is temporarily unavailable.');
      });

      player.addEventListener(IVSPlayer.PlayerState.IDLE, () => {
        console.log('Stream ended or idle');
      });

      // Load and play stream
      player.load(playbackUrl);
      player.play().catch((err: any) => {
        console.error('Failed to start playback:', err);
        setError('Failed to start playback. Click the play button to retry.');
      });

    } catch (err) {
      console.error('Failed to initialize player:', err);
      setError('Failed to initialize video player. Please refresh the page.');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/student/sessions')}
            className="mb-4 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>

          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              {error}
            </AlertDescription>
          </Alert>

          <Card className="mt-6 bg-white/5 border-white/10">
            <CardContent className="p-8 text-center">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Session Not Available</h3>
              <p className="text-gray-400 mb-4">
                The mentor hasn&apos;t started this session yet, or the session has ended.
              </p>
              <Button onClick={() => loadSession()} className="bg-blue-600 hover:bg-blue-700">
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/student/sessions')}
            className="gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Button>
          <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-2">
            <Radio className="h-3 w-3" />
            LIVE
          </Badge>
        </div>

        {/* Session Title */}
        {streamData && (
          <Card className="mb-4 bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <Radio className="h-6 w-6 text-red-500 animate-pulse" />
                {streamData.title}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Video Player */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden bg-black border-white/10">
              <CardContent className="p-0">
                <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ objectFit: 'contain' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  {!playerReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Connecting to stream...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stream Info */}
            <Card className="mt-4 bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">Stream Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-400" />
                  <span>HD Live Stream via AWS IVS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-400" />
                  <span>Low-latency streaming enabled</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Chat Area */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white">💬 Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">Chat feature coming soon!</p>
                  <p className="text-xs mt-2">
                    Real-time chat will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
