'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Video, Calendar, Clock, Users, AlertCircle, ArrowLeft, Maximize } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

interface SessionData {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  startedAt?: string;
  endedAt?: string;
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
  _count?: {
    attendance: number;
  };
}

export default function SessionWatchPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/view`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have access to this session');
        }
        throw new Error('Failed to fetch session');
      }

      const result = await response.json();
      setSession(result.data);
    } catch (err: any) {
      console.error('Error fetching session:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500 text-white';
      case 'SCHEDULED':
        return 'bg-blue-500 text-white';
      case 'ENDED':
        return 'bg-gray-500 text-white';
      case 'CANCELLED':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = document.getElementById('video-container');
    if (!document.fullscreenElement && videoContainer) {
      videoContainer.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
          <Navbar />
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !session) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
          <Navbar />
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-2xl mx-auto bg-red-500/20 border border-red-500 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white">Error</h2>
              </div>
              <p className="text-red-200 mb-6">{error || 'Session not found'}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Video Section */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div 
                id="video-container"
                className="bg-black rounded-xl overflow-hidden mb-6 relative"
                style={{ aspectRatio: '16/9' }}
              >
                {session.status === 'LIVE' && session.liveStream?.playbackUrl ? (
                  <>
                    <video
                      className="w-full h-full"
                      controls
                      autoPlay
                      src={session.liveStream.playbackUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <button
                      onClick={toggleFullscreen}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                    >
                      <Maximize className="h-5 w-5" />
                    </button>
                  </>
                ) : session.status === 'SCHEDULED' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                    <div className="text-center">
                      <Video className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Session Scheduled</h3>
                      <p className="text-gray-300">This session will start at:</p>
                      <p className="text-orange-500 font-semibold text-lg mt-2">
                        {formatDate(session.scheduledAt)} at {formatTime(session.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                      <AlertCircle className="h-20 w-20 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {session.status === 'ENDED' ? 'Session Ended' : 'Session Not Available'}
                      </h3>
                      <p className="text-gray-400">
                        {session.status === 'ENDED' 
                          ? 'This session has ended.' 
                          : 'This session is not currently streaming.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Live Indicator */}
                {session.status === 'LIVE' && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <span className="animate-pulse">●</span> LIVE
                  </div>
                )}
              </div>

              {/* Session Title and Description */}
              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
                <h1 className="text-3xl font-bold text-white mb-4">{session.title}</h1>
                
                {session.description && (
                  <p className="text-gray-300 mb-6 leading-relaxed">{session.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <span>{formatDate(session.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span>{formatTime(session.scheduledAt)} • {session.duration} min</span>
                  </div>
                  {session._count && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      <span>{session._count.attendance} attending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(session.status)}`}>
                  {session.status === 'LIVE' && (
                    <span className="flex items-center gap-2">
                      <span className="animate-pulse">●</span> LIVE NOW
                    </span>
                  )}
                  {session.status !== 'LIVE' && session.status}
                </span>
              </div>

              {/* Course Info */}
              {session.course && (
                <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Course</h3>
                  <div className="flex items-start gap-3">
                    <Image
                      src={session.course.imageUrl || '/logo/Logo.png'}
                      alt={session.course.courseName}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">{session.course.courseName}</h4>
                      {session.course.description && (
                        <p className="text-gray-400 text-sm line-clamp-3">{session.course.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mentor Info */}
              {session.mentorProfile && (
                <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Instructor</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold">
                      {session.mentorProfile.user.fullName?.[0] || session.mentorProfile.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {session.mentorProfile.user.fullName || session.mentorProfile.user.email}
                      </p>
                      <p className="text-gray-400 text-sm">Mentor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
