'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { studentService, JoinSessionResponse } from '@/services/studentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, Loader2, Video, Users } from 'lucide-react';

declare global {
  interface Window {
    IVSPlayer: any;
  }
}

export default function WatchSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const [sessionData, setSessionData] = useState<JoinSessionResponse | null>(null);
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
      document.body.removeChild(script);
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
    if (scriptLoaded && sessionData?.canJoin && sessionData.playbackUrl && videoRef.current) {
      initializePlayer(sessionData.playbackUrl);
    }
  }, [scriptLoaded, sessionData]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError('');

      const token = (session?.user as any)?.accessToken;
      if (!token) {
        setError('Please log in to join this session');
        setLoading(false);
        return;
      }

      const response = await studentService.joinSession(sessionId, token);
      setSessionData(response.data);

      if (!response.data.canJoin) {
        setError(response.data.message || 'Unable to join session at this time');
      }
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to load session. Please try again.'
      );
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

      // Attach to video element
      player.attachHTMLVideoElement(videoRef.current);

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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  if (error || !sessionData?.canJoin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/student/sessions')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {error || sessionData?.message || 'Unable to join this session'}
          </AlertDescription>
        </Alert>

        {sessionData?.session && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{sessionData.session.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{sessionData.session.description}</p>
              <div className="flex gap-2">
                <Badge>{sessionData.session.status}</Badge>
                <Badge variant="outline">{sessionData.session.courseName}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/student/sessions')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>
        <Badge className="bg-red-600 text-white animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
          LIVE
        </Badge>
      </div>

      {/* Session Info */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {sessionData.session.title}
              </CardTitle>
              {sessionData.session.description && (
                <p className="text-gray-600 text-sm">
                  {sessionData.session.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{sessionData.session.courseName}</Badge>
            {sessionData.session.mentorName && (
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {sessionData.session.mentorName}
              </Badge>
            )}
            {sessionData.session.enableChat && (
              <Badge variant="secondary">💬 Chat Enabled</Badge>
            )}
            {sessionData.session.enableQuiz && (
              <Badge variant="secondary">📝 Quiz Enabled</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Player */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
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
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Stream Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">HD Live Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  Duration: {sessionData.session.duration} minutes
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Chat/Quiz Area */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">Chat feature coming soon!</p>
                <p className="text-xs mt-2">
                  Real-time chat will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quiz Section (if enabled) */}
      {sessionData.session.enableQuiz && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Session Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">No active quiz at the moment</p>
              <p className="text-xs mt-2">
                Your mentor will launch quizzes during the session
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
