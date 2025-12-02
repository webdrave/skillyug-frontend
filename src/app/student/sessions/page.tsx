'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { studentService, StudentSession } from '@/services/studentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, Users, PlayCircle, CalendarClock } from 'lucide-react';
import { formatDistanceToNow, format, isPast, isFuture } from 'date-fns';

// Helper function to display time based on session status
function getTimeDisplay(scheduledAt: string, status: string) {
  const date = new Date(scheduledAt);
  
  if (status === 'LIVE') {
    return (
      <span className="text-red-600 font-semibold flex items-center gap-1">
        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
        LIVE NOW
      </span>
    );
  }
  
  if (isFuture(date)) {
    return (
      <span className="text-blue-600">
        Starts {formatDistanceToNow(date, { addSuffix: true })}
      </span>
    );
  }
  
  return (
    <span className="text-gray-500">
      {format(date, 'MMM d, yyyy • h:mm a')}
    </span>
  );
}

export default function StudentSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only load sessions when authentication is confirmed
    if (status === 'authenticated' && session) {
      loadSessions();
    } else if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [session, status, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = (session?.user as any)?.accessToken;
      
      if (!token) {
        console.error('No access token found in session:', session);
        setError('Authentication token not found. Please log out and log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching sessions with token...');
      const response = await studentService.getMySessions(token);
      console.log('Sessions response:', response);
      setSessions(response.data.sessions || []);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load sessions';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (sessionId: string) => {
    router.push(`/session/${sessionId}/watch`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500 text-white animate-pulse';
      case 'SCHEDULED':
        return 'bg-blue-500 text-white';
      case 'COMPLETED':
        return 'bg-gray-500 text-white';
      case 'CANCELLED':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const liveSessions = sessions.filter(s => s.status === 'LIVE');
  const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const pastSessions = sessions.filter(s => s.status === 'COMPLETED');

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Live Sessions</h1>
        <p className="text-gray-600">
          Join live classes and interact with your mentors
        </p>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {sessions.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">
              Enroll in courses to see upcoming live sessions
            </p>
            <Button onClick={() => router.push('/courses')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Live Sessions */}
      {liveSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Live Now
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CalendarClock className="h-6 w-6" />
            Upcoming Sessions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Past Sessions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={handleJoinSession}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  onJoin,
}: {
  session: StudentSession;
  onJoin: (id: string) => void;
}) {
  const scheduledDate = new Date(session.scheduledAt);
  const isLive = session.status === 'LIVE';
  const isUpcoming = session.status === 'SCHEDULED' && isFuture(scheduledDate);
  const canJoin = isLive;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isLive ? 'border-red-500 border-2' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={getStatusColor(session.status)}>
            {session.status}
          </Badge>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              <PlayCircle className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2">{session.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {session.courseName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {session.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            {getTimeDisplay(session.scheduledAt, session.status)}
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            {session.duration} minutes
          </div>

          {session.mentorName && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              {session.mentorName}
            </div>
          )}

          {session.attendanceCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              {session.attendanceCount} attending
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {canJoin ? (
            <Button 
              onClick={() => onJoin(session.id)}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Join Live Class
            </Button>
          ) : isUpcoming ? (
            <Button 
              disabled
              variant="outline"
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Starts {formatDistanceToNow(scheduledDate, { addSuffix: true })}
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="w-full"
              disabled
            >
              Session Ended
            </Button>
          )}
        </div>

        {/* Features */}
        <div className="flex gap-2 flex-wrap">
          {session.enableChat && (
            <Badge variant="secondary" className="text-xs">💬 Chat</Badge>
          )}
          {session.enableQuiz && (
            <Badge variant="secondary" className="text-xs">📝 Quiz</Badge>
          )}
          {session.enableAttendance && (
            <Badge variant="secondary" className="text-xs">✓ Attendance</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'LIVE':
      return 'bg-red-500 text-white';
    case 'SCHEDULED':
      return 'bg-blue-500 text-white';
    case 'COMPLETED':
      return 'bg-gray-500 text-white';
    case 'CANCELLED':
      return 'bg-yellow-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}
