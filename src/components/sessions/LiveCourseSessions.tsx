'use client';

import React, { useEffect, useState } from 'react';
import { Video, Loader2, Calendar } from 'lucide-react';
import { apiHelpers } from '@/lib/api';
import { LiveSessionCard } from './LiveSessionCard';

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
  _count?: {
    attendance: number;
  };
}

interface LiveCoursesSessionsProps {
  limit?: number;
  showTitle?: boolean;
}

export const LiveCourseSessions: React.FC<LiveCoursesSessionsProps> = ({ 
  limit = 10,
  showTitle = true 
}) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveSessions();
    
    // Refresh every 30 seconds to check for new live sessions
    const interval = setInterval(fetchLiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveSessions = async () => {
    try {
      const response: any = await apiHelpers.get(
        `/student/sessions`,
        {}
      );

      if (response.status === 'success' && response.data) {
        // Filter only LIVE sessions - response.data contains { sessions, count }
        const allSessions = response.data.sessions || response.data || [];
        const liveSessions = allSessions.filter(
          (session: SessionData) => session.status === 'LIVE'
        );
        setSessions(liveSessions.slice(0, limit));
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching live sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-8">
        {showTitle && (
          <div className="flex items-center gap-3 mb-6">
            <Video className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Live Classes</h2>
          </div>
        )}
        <div className="text-center py-8">
          <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No live classes at the moment</p>
          <p className="text-gray-500 text-sm mt-2">Check back later or view upcoming sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Live Classes</h2>
          </div>
          <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            {sessions.length} LIVE
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((session, index) => (
          <LiveSessionCard 
            key={session.id} 
            session={session} 
            autoPlay={index === 0} // Auto-play the first video
          />
        ))}
      </div>
    </div>
  );
};
