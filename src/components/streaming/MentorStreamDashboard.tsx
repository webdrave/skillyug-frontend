'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { sessionService, Session, StartSessionResponse, StreamingCredentials } from '@/services/sessionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Play, Square, Calendar, Users, Clock, Copy, Check, ExternalLink, Radio, AlertCircle, Key, RefreshCw } from 'lucide-react';

export function MentorStreamDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [gettingCredentials, setGettingCredentials] = useState<string | null>(null);
  const [streamCredentials, setStreamCredentials] = useState<StreamingCredentials | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Separate sessions by status
  const scheduledSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const liveSessions = sessions.filter(s => s.status === 'LIVE');
  const endedSessions = sessions.filter(s => s.status === 'ENDED');

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
      // Convert StartSessionResponse to StreamingCredentials format
      setStreamCredentials({
        ingestServer: result.ingestEndpoint,
        streamKey: result.streamKey,
        playbackUrl: result.playbackUrl,
        channelId: result.channelId,
        sessionId: sessionId,
        status: 'LIVE',
        message: 'Session started successfully!'
      });
      setActiveSessionId(sessionId);
      await loadSessions(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to start session';
      alert(errorMessage.includes('Mentor profile') 
        ? 'Your mentor profile is not set up. Please contact support or try logging out and back in.'
        : errorMessage.includes('no free channels')
        ? 'No streaming channels available. Please contact admin or try again later.'
        : errorMessage);
    } finally {
      setStartingSession(null);
    }
  };

  // NEW: Get streaming credentials without starting the session
  // This allows mentors to configure OBS before going live
  const handleGetCredentials = async (sessionId: string) => {
    try {
      setGettingCredentials(sessionId);
      const result = await sessionService.getStreamingCredentials(sessionId);
      setStreamCredentials(result);
      setActiveSessionId(sessionId);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to get credentials';
      alert(errorMessage.includes('no free channels') || errorMessage.includes('No available channels')
        ? 'No streaming channels available. Please contact admin or try again later.'
        : errorMessage);
    } finally {
      setGettingCredentials(null);
    }
  };

  // NEW: Release credentials without ending (for when they want to cancel before going live)
  const handleReleaseCredentials = async () => {
    if (!activeSessionId) return;
    
    try {
      await sessionService.releaseStreamingCredentials(activeSessionId);
      setStreamCredentials(null);
      setActiveSessionId(null);
    } catch (error: any) {
      console.error('Failed to release credentials:', error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    try {
      await sessionService.endSession(sessionId);
      setStreamCredentials(null);
      setActiveSessionId(null);
      await loadSessions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to end session');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate the full RTMPS URL for OBS
  const getRtmpsUrl = () => {
    if (!streamCredentials) return '';
    return `rtmps://${streamCredentials.ingestServer}:443/app/${streamCredentials.streamKey}`;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Streaming Sessions</h1>
        <Button onClick={() => router.push('/mentor/sessions/schedule')} className="bg-orange-500 hover:bg-orange-600">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule New Session
        </Button>
      </div>

      {/* Stream Credentials Display */}
      {streamCredentials && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Video className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold text-green-800 dark:text-green-400">
                {streamCredentials.status === 'LIVE' 
                  ? '🎬 Session is LIVE! Use these credentials in OBS Studio:'
                  : '🔑 Streaming Credentials Ready! Configure OBS Studio with these settings:'}
              </p>
              
              {streamCredentials.status !== 'LIVE' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    <strong>⚠️ Note:</strong> These credentials are reserved for you. Configure OBS now, then click &quot;Start Streaming&quot; in OBS when you&apos;re ready to go live!
                  </p>
                </div>
              )}
              
              {/* OBS RTMPS URL - Full URL for easy copying */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">📺 OBS RTMPS URL (Copy this to OBS Server field):</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getRtmpsUrl(), 'rtmps')}
                    className="h-8"
                  >
                    {copiedField === 'rtmps' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all text-blue-600 dark:text-blue-400 font-mono">
                  {getRtmpsUrl()}
                </code>
              </div>

              {/* Individual Credentials */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Ingest Server:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`rtmps://${streamCredentials.ingestServer}:443/app`, 'ingest')}
                      className="h-7 text-xs"
                    >
                      {copiedField === 'ingest' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1.5 rounded block break-all font-mono">
                    rtmps://{streamCredentials.ingestServer}:443/app
                  </code>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Stream Key:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(streamCredentials.streamKey, 'streamKey')}
                      className="h-7 text-xs"
                    >
                      {copiedField === 'streamKey' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1.5 rounded block break-all font-mono">
                    {streamCredentials.streamKey}
                  </code>
                </div>
              </div>

              {/* Playback URL for Students */}
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">👥 Playback URL (for students):</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(streamCredentials.playbackUrl, 'playback')}
                    className="h-7 text-xs"
                  >
                    {copiedField === 'playback' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1.5 rounded block break-all font-mono">
                  {streamCredentials.playbackUrl}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 flex-wrap">
                {streamCredentials.status === 'LIVE' ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => activeSessionId && handleEndSession(activeSessionId)}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    End Session
                  </Button>
                ) : (
                  <>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => activeSessionId && handleStartSession(activeSessionId)}
                      disabled={startingSession === activeSessionId}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {startingSession === activeSessionId ? 'Going Live...' : 'Go Live Now'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleReleaseCredentials}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Release & Cancel
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open('https://obsproject.com/', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Download OBS
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* OBS Setup Instructions */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            OBS Studio Setup Instructions
          </CardTitle>
          <CardDescription>Follow these steps to start streaming your live session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Download and install <a href="https://obsproject.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">OBS Studio</a> if you haven&apos;t already</li>
            <li>Click <strong>&quot;Get OBS Credentials&quot;</strong> on your scheduled session below</li>
            <li>In OBS, go to <strong>Settings → Stream</strong></li>
            <li>Set <strong>Service</strong> to: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">Custom</code></li>
            <li>Copy the <strong>Ingest Server</strong> to the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">Server</code> field</li>
            <li>Copy the <strong>Stream Key</strong> to the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">Stream Key</code> field</li>
            <li>Click <strong>Apply</strong>, then click <strong>&quot;Start Streaming&quot;</strong> in OBS when ready</li>
            <li>Students will automatically see your live stream once you start!</li>
          </ol>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <strong>💡 Tip:</strong> You can get credentials ahead of time to configure OBS, then start streaming whenever you&apos;re ready. The channel is reserved for your session.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List - Organized by Status */}
      <div className="space-y-8">
        
        {/* LIVE SESSIONS - Show first with emphasis */}
        {liveSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-red-600">
              <Radio className="h-5 w-5 animate-pulse" />
              Live Now ({liveSessions.length})
            </h2>
            <div className="grid gap-4">
              {liveSessions.map((session) => (
                <Card key={session.id} className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                          {session.title}
                        </CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">🔴 LIVE</Badge>
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
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="destructive"
                        onClick={() => handleEndSession(session.id)}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        End Session
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/mentor/sessions/${session.id}`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SCHEDULED SESSIONS - Ready to Start */}
        {scheduledSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-orange-600">
              <Calendar className="h-5 w-5" />
              Scheduled Sessions ({scheduledSessions.length}) - Ready to Start
            </h2>
            <div className="grid gap-4">
              {scheduledSessions.map((session) => (
                <Card key={session.id} className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{session.title}</CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </div>
                      <Badge variant="default" className="bg-orange-500">SCHEDULED</Badge>
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
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleGetCredentials(session.id)}
                        disabled={gettingCredentials === session.id || activeSessionId === session.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        {gettingCredentials === session.id ? 'Getting...' : '🔑 Get OBS Credentials'}
                      </Button>
                      <Button
                        onClick={() => handleStartSession(session.id)}
                        disabled={startingSession === session.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {startingSession === session.id ? 'Starting...' : '▶ Start & Go Live'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push(`/mentor/sessions/${session.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      💡 Click &quot;Get OBS Credentials&quot; to configure OBS first, then go live when ready!
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ENDED SESSIONS */}
        {endedSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-500">
              <Square className="h-5 w-5" />
              Past Sessions ({endedSessions.length})
            </h2>
            <div className="grid gap-4">
              {endedSessions.map((session) => (
                <Card key={session.id} className="border-gray-200 dark:border-gray-700 opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-gray-600">{session.title}</CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </div>
                      <Badge variant="outline">ENDED</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(session.scheduledAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(session.scheduledAt), 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{session.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>{session.streamType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/mentor/sessions/${session.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Sessions Message */}
        {sessions.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sessions Yet</h3>
              <p className="text-gray-500 mb-4">Schedule your first live session to get started!</p>
              <Button onClick={() => router.push('/mentor/sessions/schedule')}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule New Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
