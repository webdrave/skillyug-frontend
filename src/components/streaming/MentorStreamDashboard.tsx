'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sessionService, Session, StartSessionResponse } from '@/services/sessionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Play, Square, Calendar, Users, Clock } from 'lucide-react';

export function MentorStreamDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [streamCredentials, setStreamCredentials] = useState<StartSessionResponse | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await sessionService.getMySessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      setSessions([]); // Set empty array on error
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      if (errorMessage?.includes('Mentor profile')) {
        alert('Your mentor profile is not set up. Please contact support or try logging out and back in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      setStartingSession(sessionId);
      const result = await sessionService.startSession(sessionId);
      setStreamCredentials(result);
      await loadSessions(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to start session';
      alert(errorMessage.includes('Mentor profile') 
        ? 'Your mentor profile is not set up. Please contact support or try logging out and back in.'
        : errorMessage);
    } finally {
      setStartingSession(null);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    try {
      await sessionService.endSession(sessionId);
      setStreamCredentials(null);
      await loadSessions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to end session');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SCHEDULED: 'default',
      LIVE: 'secondary',
      ENDED: 'outline',
      CANCELLED: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading sessions...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Streaming Sessions</h1>
        <Button onClick={() => window.location.href = '/mentor/sessions/schedule'}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule New Session
        </Button>
      </div>

      {/* Stream Credentials Display */}
      {streamCredentials && (
        <Alert className="bg-green-50 border-green-200">
          <Video className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Session Started! Use these credentials in OBS:</p>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm"><strong>Stream Key:</strong></p>
                <code className="text-xs bg-gray-100 p-1 rounded block mt-1 break-all">
                  {streamCredentials.credentials.streamKey}
                </code>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm"><strong>Ingest Endpoint:</strong></p>
                <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
                  {streamCredentials.credentials.ingestEndpoint}
                </code>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm"><strong>Playback URL:</strong></p>
                <code className="text-xs bg-gray-100 p-1 rounded block mt-1 break-all">
                  {streamCredentials.credentials.playbackUrl}
                </code>
              </div>
              <div className="pt-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleEndSession(streamCredentials.session.id)}
                >
                  <Square className="mr-2 h-4 w-4" />
                  End Session
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* OBS Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>OBS Studio Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to start streaming</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Download and install <a href="https://obsproject.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OBS Studio</a></li>
            <li>Click &quot;Start Session&quot; below to get your stream credentials</li>
            <li>In OBS, go to Settings → Stream</li>
            <li>Service: Custom</li>
            <li>Copy the <strong>Ingest Endpoint</strong> to the Server field</li>
            <li>Copy the <strong>Stream Key</strong> to the Stream Key field</li>
            <li>Click Apply, then click &quot;Start Streaming&quot; in OBS</li>
            <li>Students can watch at the Playback URL provided</li>
          </ol>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="grid gap-4">
        {Array.isArray(sessions) && sessions.length > 0 ? (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{session.title}</CardTitle>
                    <CardDescription>{session.description}</CardDescription>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(session.scheduledAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(session.scheduledAt), 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{session.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-500" />
                  <span>{session.streamType}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {session.status === 'SCHEDULED' && (
                  <Button
                    onClick={() => handleStartSession(session.id)}
                    disabled={startingSession === session.id}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {startingSession === session.id ? 'Starting...' : 'Start Session'}
                  </Button>
                )}
                {session.status === 'LIVE' && (
                  <>
                    <Button 
                      variant="destructive"
                      onClick={() => handleEndSession(session.id)}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      End Session
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = `/mentor/sessions/${session.id}/manage`}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Session
                    </Button>
                  </>
                )}
                {session.status === 'ENDED' && (
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = `/mentor/sessions/${session.id}/analytics`}
                  >
                    View Analytics
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No sessions found. Schedule your first session to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {!loading && sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No sessions scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
