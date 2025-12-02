'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, Play, AlertCircle, Maximize, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';

interface LiveSessionCardProps {
  session: {
    id: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration: number;
    status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
    course?: {
      id: string;
      courseName: string;
      imageUrl: string;
      description?: string;
    };
    mentorProfile?: {
      user: {
        id: string;
        fullName?: string;
        email: string;
        image?: string;
      };
    };
    liveStream?: {
      id: string;
      playbackUrl: string;
      status: string;
      isActive: boolean;
    };
    playbackUrl?: string; // Added root playbackUrl
    _count?: {
      attendance: number;
    };
  };
  autoPlay?: boolean;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ session, autoPlay = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const url = session.playbackUrl || session.liveStream?.playbackUrl;
    if (session.status === 'LIVE' && url) {
      loadIVSPlayer();
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.delete();
        } catch (err) {
          console.error('Error cleaning up player:', err);
        }
      }
    };
  }, [session.playbackUrl, session.liveStream?.playbackUrl]);

  const loadIVSPlayer = () => {
    if (typeof window === 'undefined' || !videoRef.current) return;

    // Check if IVS player script is already loaded
    if ((window as any).IVSPlayer) {
      initializePlayer();
      return;
    }

    // Load IVS player script dynamically
    const script = document.createElement('script');
    script.src = 'https://player.live-video.net/1.27.0/amazon-ivs-player.min.js';
    script.async = true;
    script.onload = () => initializePlayer();
    script.onerror = () => setError('Failed to load video player');
    document.body.appendChild(script);
  };

  const initializePlayer = () => {
    const url = session.playbackUrl || session.liveStream?.playbackUrl;
    if (!videoRef.current || !url) return;

    const { IVSPlayer } = window as any;
    
    if (!IVSPlayer.isPlayerSupported) {
      setError('Your browser does not support the video player');
      return;
    }

    try {
      const player = IVSPlayer.create();
      player.attachHTMLVideoElement(videoRef.current);
      player.load(url);
      
      if (autoPlay) {
        player.play().catch((err: any) => {
          console.error('Autoplay failed:', err);
        });
      }
      
      // Event listeners
      player.addEventListener(IVSPlayer.PlayerState.PLAYING, () => {
        setIsPlaying(true);
        setError(null);
      });

      player.addEventListener(IVSPlayer.PlayerState.IDLE, () => {
        setIsPlaying(false);
      });

      player.addEventListener(IVSPlayer.PlayerEventType.ERROR, (err: any) => {
        console.error('Player error:', err);
        setError('Stream error. The stream may have ended.');
        setIsPlaying(false);
      });

      playerRef.current = player;
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to initialize video player');
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play().catch((err: any) => {
        console.error('Play failed:', err);
        setError('Failed to play stream');
      });
    }
  };

  const handleMuteToggle = () => {
    if (!playerRef.current) return;
    const newMutedState = !isMuted;
    playerRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const url = session.playbackUrl || session.liveStream?.playbackUrl;
  if (session.status !== 'LIVE' || !url) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-red-500 font-bold text-sm">LIVE NOW</span>
        <span className="text-gray-400 text-sm ml-auto flex items-center gap-1">
          <Users className="h-4 w-4" />
          {session._count?.attendance || 0} watching
        </span>
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
        />
        
        {/* Player Controls Overlay */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="bg-orange-500 hover:bg-orange-600 rounded-full p-2 transition-colors"
              >
                <Play className="h-5 w-5 text-white" fill={isPlaying ? 'white' : 'none'} />
              </button>
              
              <button
                onClick={handleMuteToggle}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              <div className="flex-1"></div>

              <button
                onClick={handleFullscreen}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              >
                <Maximize className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <AlertCircle className="h-12 w-12 text-red-400 mb-2" />
            <p className="text-white text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Session Info */}
      <div className="flex gap-4">
        {session.course?.imageUrl && (
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={session.course.imageUrl}
              alt={session.course.courseName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1 truncate">
            {session.title}
          </h3>
          <p className="text-gray-300 text-sm mb-2">
            {session.course?.courseName}
          </p>
          {session.mentorProfile?.user && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {session.mentorProfile.user.fullName?.[0] || session.mentorProfile.user.email[0].toUpperCase()}
              </div>
              <span>
                {session.mentorProfile.user.fullName || session.mentorProfile.user.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
