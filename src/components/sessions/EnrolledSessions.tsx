'use client'

import React, { useEffect, useState } from 'react';
import { Video, Calendar, Clock, Users, PlayCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiHelpers } from '@/lib/api';

interface SessionData {
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
}

interface EnrolledSessionsProps {
  limit?: number;
  showTitle?: boolean;
}

export const EnrolledSessions: React.FC<EnrolledSessionsProps> = ({ 
  limit = 10,
  showTitle = true 
}) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response: any = await apiHelpers.get(
        `/student/sessions`,
        {}
      );

      if (response.status === 'success' && response.data) {
        // response.data contains { sessions, count }
        const allSessions = response.data.sessions || response.data || [];
        setSessions(allSessions.slice(0, limit));
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // Set empty array instead of error to not break the page
      setSessions([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  const handleJoinSession = (sessionId: string, playbackUrl?: string) => {
    if (playbackUrl) {
      router.push(`/sessions/${sessionId}/watch`);
    } else {
      router.push(`/sessions/${sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white mb-4">Your Upcoming Sessions</h2>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-8 text-center">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white mb-4">Your Upcoming Sessions</h2>
        )}
        <Video className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No upcoming sessions</p>
        <p className="text-gray-500 text-sm">
          Sessions scheduled by your mentors will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h2 className="text-2xl font-bold text-white mb-4">Your Upcoming Sessions</h2>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:bg-black/40 transition-all duration-300"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                {session.status === 'LIVE' && (
                  <span className="flex items-center gap-1">
                    <span className="animate-pulse">●</span> LIVE NOW
                  </span>
                )}
                {session.status !== 'LIVE' && session.status}
              </span>
              {session._count && (
                <div className="flex items-center gap-1 text-gray-400 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{session._count.attendance} attending</span>
                </div>
              )}
            </div>

            {/* Course Info */}
            {session.course && (
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src={session.course.imageUrl || '/logo/Logo.png'}
                  alt={session.course.courseName}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-400">Course</p>
                  <p className="text-white font-medium truncate">{session.course.courseName}</p>
                </div>
              </div>
            )}

            {/* Session Title */}
            <h3 className="text-xl font-semibold text-white mb-2">{session.title}</h3>
            
            {session.description && (
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{session.description}</p>
            )}

            {/* Mentor Info */}
            {session.mentorProfile && (
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                  {session.mentorProfile.user.fullName?.[0] || session.mentorProfile.user.email[0].toUpperCase()}
                </div>
                <p className="text-gray-400 text-sm">
                  by {session.mentorProfile.user.fullName || session.mentorProfile.user.email}
                </p>
              </div>
            )}

            {/* Session Details */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>{formatDate(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{formatTime(session.scheduledAt)} • {session.duration} min</span>
              </div>
            </div>

            {/* Action Button */}
            {session.status === 'LIVE' && (
              <button
                onClick={() => handleJoinSession(session.id, session.playbackUrl || session.liveStream?.playbackUrl)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <PlayCircle className="h-5 w-5" />
                Join Live Session
              </button>
            )}
            
            {session.status === 'SCHEDULED' && (
              <button
                onClick={() => handleJoinSession(session.id)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Video className="h-5 w-5" />
                View Details
              </button>
            )}

            {session.status === 'ENDED' && (
              <button
                disabled
                className="w-full bg-gray-600 text-gray-300 font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
              >
                Session Ended
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
