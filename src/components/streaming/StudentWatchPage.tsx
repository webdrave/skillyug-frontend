'use client';

/**
 * StudentWatchPage Component
 * 
 * The student's view for watching live streaming classes.
 * Integrates AWS IVS Player for HLS playback.
 * 
 * Features:
 * - Auto-check if class is live on mount
 * - AWS IVS Player integration
 * - Custom video controls
 * - Live indicator and viewer count
 * - Auto-refresh when waiting for stream
 * - Graceful error handling
 * - Responsive design
 * 
 * AWS IVS Player Events:
 * - PLAYING: Stream is playing
 * - BUFFERING: Stream is buffering
 * - IDLE: Player is idle
 * - ENDED: Stream has ended
 * - ERROR: Playback error occurred
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mentorChannelService, ActiveClassStatus } from '@/services/mentorChannelService';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  Video, 
  Users, 
  Radio, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Play,
  Pause,
  Clock
} from 'lucide-react';

// ============================================
// AWS IVS PLAYER TYPES
// ============================================
interface IVSPlayerType {
  create: () => IVSPlayerInstance;
  isPlayerSupported: boolean;
  PlayerState: {
    READY: string;
    PLAYING: string;
    BUFFERING: string;
    IDLE: string;
    ENDED: string;
  };
  PlayerEventType: {
    ERROR: string;
    QUALITY_CHANGED: string;
    STATE_CHANGED: string;
    TEXT_CUE: string;
  };
}

interface IVSPlayerInstance {
  attachHTMLVideoElement: (element: HTMLVideoElement) => void;
  load: (url: string) => void;
  play: () => void;
  pause: () => void;
  delete: () => void;
  addEventListener: (event: string, callback: (data?: any) => void) => void;
  removeEventListener: (event: string, callback: (data?: any) => void) => void;
  getState: () => string;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getQualities: () => any[];
  getQuality: () => any;
  setQuality: (quality: any) => void;
}

// Window.IVSPlayer type is declared in @/types/ivs-player.d.ts

// ============================================
// COMPONENT PROPS
// ============================================
interface StudentWatchPageProps {
  /** The class/course ID to watch */
  classId: string;
  /** Optional callback when leaving the page */
  onBack?: () => void;
  /** Poll interval in ms (default: 10000) */
  pollInterval?: number;
}

// ============================================
// COMPONENT
// ============================================
export function StudentWatchPage({ 
  classId, 
  onBack,
  pollInterval = 10000 
}: StudentWatchPageProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<IVSPlayerInstance | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [classStatus, setClassStatus] = useState<ActiveClassStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'buffering' | 'error' | 'idle'>('loading');
  
  // Player controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Router
  const router = useRouter();

  // ============================================
  // LIFECYCLE
  // ============================================
  
  useEffect(() => {
    checkClassStatus();
    
    // Cleanup on unmount
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.delete();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [classId]);

  // Start polling when not live
  useEffect(() => {
    if (!classStatus?.isLive && !loading) {
      // Poll for stream status
      pollRef.current = setInterval(() => {
        checkClassStatus();
      }, pollInterval);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [classStatus?.isLive, loading, pollInterval]);

  // Initialize player when stream becomes live
  useEffect(() => {
    if (classStatus?.isLive && classStatus.playbackUrl && videoRef.current) {
      loadIVSPlayer(classStatus.playbackUrl);
    }
  }, [classStatus?.isLive, classStatus?.playbackUrl]);

  // ============================================
  // API CALLS
  // ============================================
  
  const checkClassStatus = async () => {
    try {
      setError(null);
      const status = await mentorChannelService.getActiveClass(classId);
      setClassStatus(status);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to check class status');
      setLoading(false);
    }
  };

  // ============================================
  // IVS PLAYER
  // ============================================
  
  const loadIVSPlayer = useCallback((playbackUrl: string) => {
    // Check if already loaded
    if (window.IVSPlayer) {
      initializePlayer(playbackUrl);
      return;
    }

    // Load IVS Player SDK from CDN
    const script = document.createElement('script');
    script.src = 'https://player.live-video.net/1.27.0/amazon-ivs-player.min.js';
    script.async = true;
    
    script.onload = () => {
      initializePlayer(playbackUrl);
    };
    
    script.onerror = () => {
      setError('Failed to load video player. Please refresh the page.');
      setPlayerState('error');
    };
    
    document.body.appendChild(script);
  }, []);

  const initializePlayer = (playbackUrl: string) => {
    if (!videoRef.current || !window.IVSPlayer) {
      setError('Video element not ready');
      return;
    }

    const { IVSPlayer } = window;

    // Check browser support
    if (!IVSPlayer.isPlayerSupported) {
      setError('Your browser does not support the video player. Please use a modern browser.');
      setPlayerState('error');
      return;
    }

    try {
      // Create player instance
      const player = IVSPlayer.create();
      playerRef.current = player;

      // Attach to video element
      player.attachHTMLVideoElement(videoRef.current);

      // Event listeners
      player.addEventListener(IVSPlayer.PlayerState.READY, () => {
        console.log('IVS Player: Ready');
        setPlayerState('idle');
      });

      player.addEventListener(IVSPlayer.PlayerState.PLAYING, () => {
        console.log('IVS Player: Playing');
        setPlayerState('playing');
        setIsPaused(false);
      });

      player.addEventListener(IVSPlayer.PlayerState.BUFFERING, () => {
        console.log('IVS Player: Buffering');
        setPlayerState('buffering');
      });

      player.addEventListener(IVSPlayer.PlayerState.IDLE, () => {
        console.log('IVS Player: Idle');
        setPlayerState('idle');
      });

      player.addEventListener(IVSPlayer.PlayerState.ENDED, () => {
        console.log('IVS Player: Ended');
        setPlayerState('idle');
        // Stream ended - go back to waiting
        setClassStatus(prev => prev ? { ...prev, isLive: false } : null);
      });

      player.addEventListener(IVSPlayer.PlayerEventType.ERROR, (err: any) => {
        console.error('IVS Player Error:', err);
        setPlayerState('error');
        // Check if stream ended
        if (err?.type === 'ErrorNotAvailable') {
          setError('The stream has ended or is not available.');
          setClassStatus(prev => prev ? { ...prev, isLive: false } : null);
        } else {
          setError('Error playing stream. The stream may have ended.');
        }
      });

      // Load and play
      player.load(playbackUrl);
      player.play();

    } catch (err) {
      console.error('Error initializing IVS player:', err);
      setError('Failed to initialize video player.');
      setPlayerState('error');
    }
  };

  // ============================================
  // PLAYER CONTROLS
  // ============================================
  
  const toggleMute = () => {
    if (playerRef.current) {
      const newMuted = !isMuted;
      playerRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPaused) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderLoadingState = () => (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-300">Checking class status...</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-white text-center">{error}</p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={checkClassStatus}
            className="border-gray-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-gray-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderWaitingState = () => (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="h-6 w-6 text-orange-500" />
          Waiting for Live Stream
        </CardTitle>
        <CardDescription className="text-gray-400">
          The class is not live yet. This page will automatically update when the stream starts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-800 rounded-lg aspect-video flex flex-col items-center justify-center">
          <Video className="h-16 w-16 text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">Stream not started</p>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking every {pollInterval / 1000}s...</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <Button 
            variant="outline" 
            onClick={checkClassStatus}
            className="border-gray-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Now
          </Button>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-gray-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderVideoPlayer = () => (
    <div className="space-y-4">
      {/* Video Container */}
      <Card className="bg-gray-900 border-gray-700 overflow-hidden">
        <div 
          id="video-container"
          className="relative bg-black aspect-video"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            autoPlay
          />

          {/* Buffering Overlay */}
          {playerState === 'buffering' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <RefreshCw className="h-12 w-12 text-white animate-spin" />
            </div>
          )}

          {/* Live Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className="bg-red-600 text-white animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
            {classStatus?.viewerCount !== undefined && (
              <Badge variant="secondary" className="bg-gray-800/80">
                <Users className="h-3 w-3 mr-1" />
                {classStatus.viewerCount}
              </Badge>
            )}
          </div>

          {/* Custom Controls Overlay */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </Button>

                {/* Mute */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                {/* Stream Health */}
                {classStatus?.streamHealth && (
                  <Badge variant={classStatus.streamHealth === 'HEALTHY' ? 'default' : 'destructive'}>
                    {classStatus.streamHealth}
                  </Badge>
                )}

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Class Info Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white text-2xl">
                {classStatus?.classTitle || 'Live Class'}
              </CardTitle>
              {classStatus?.mentorName && (
                <CardDescription className="text-gray-400 mt-2">
                  Taught by {classStatus.mentorName}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{classStatus?.viewerCount || 0} watching</span>
              </div>
              {classStatus?.startedAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Started {new Date(classStatus.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {onBack && (
          <CardContent>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-gray-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Leave Class
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  
  if (loading) {
    return renderLoadingState();
  }

  if (error && !classStatus) {
    return renderErrorState();
  }

  if (!classStatus?.isLive) {
    return renderWaitingState();
  }

  return renderVideoPlayer();
}

export default StudentWatchPage;
