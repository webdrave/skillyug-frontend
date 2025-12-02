'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Video, Calendar, Clock, Users, AlertCircle, ArrowLeft, PlayCircle } from 'lucide-react';
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
  playbackUrl?: string; // Added root playbackUrl
  _count?: {
    attendance: number;
  };
}

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const token = (authSession?.user as any)?.accessToken;

  useEffect(() => {
    if (sessionId && token) {
      fetchSession();
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchSession, 10000);
      return () => clearInterval(interval);
    }
  }, [sessionId, token]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/view`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
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

          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl overflow-hidden mb-8">
              {session.course && (
                <div className="relative h-64 bg-gradient-to-br from-blue-900 to-purple-900">
                  <Image
                    src={session.course.imageUrl || '/logo/Logo.png'}
                    alt={session.course.courseName}
                    fill
                    className="object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${getStatusColor(session.status)}`}>
                      {session.status === 'LIVE' && (
                        <span className="flex items-center gap-2">
                          <span className="animate-pulse">●</span> LIVE NOW
                        </span>
                      )}
                      {session.status !== 'LIVE' && session.status}
                    </span>
                    <h1 className="text-4xl font-bold text-white mb-2">{session.title}</h1>
                    <p className="text-gray-300">{session.course.courseName}</p>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 p-3 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Date</p>
                      <p className="text-white font-medium">{formatDate(session.scheduledAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Time</p>
                      <p className="text-white font-medium">{formatTime(session.scheduledAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Duration</p>
                      <p className="text-white font-medium">{session.duration} minutes</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {session.description && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-3">About This Session</h2>
                    <p className="text-gray-300 leading-relaxed">{session.description}</p>
                  </div>
                )}

                {/* Mentor Info */}
                {session.mentorProfile && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-3">Instructor</h2>
                    <div className="flex items-center gap-4 bg-black/30 p-4 rounded-lg">
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                        {session.mentorProfile.user.fullName?.[0] || session.mentorProfile.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {session.mentorProfile.user.fullName || session.mentorProfile.user.email}
                        </p>
                        <p className="text-gray-400">Course Mentor</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-4">
                  {session.status === 'LIVE' && (
                    <button
                      onClick={() => router.push(`/sessions/${sessionId}/watch`)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <PlayCircle className="h-6 w-6" />
                      Join Live Session
                    </button>
                  )}
                  
                  {session.status === 'SCHEDULED' && (
                    <div className="flex-1 bg-blue-500/20 border border-blue-500 text-blue-300 font-semibold py-4 px-6 rounded-lg text-center">
                      <p className="mb-1">Session starts in:</p>
                      <p className="text-lg">{formatDate(session.scheduledAt)} at {formatTime(session.scheduledAt)}</p>
                    </div>
                  )}

                  {session.status === 'ENDED' && (
                    <div className="flex-1 bg-gray-600 text-gray-300 font-semibold py-4 px-6 rounded-lg text-center">
                      This session has ended
                    </div>
                  )}

                  {session.status === 'CANCELLED' && (
                    <div className="flex-1 bg-orange-500/20 border border-orange-500 text-orange-300 font-semibold py-4 px-6 rounded-lg text-center">
                      This session has been cancelled
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
