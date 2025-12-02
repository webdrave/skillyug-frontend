'use client';

import React, { useState, useEffect, use } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { sessionService, Session, StartSessionResponse } from '@/services/sessionService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Play, 
  Square, 
  Calendar, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  ArrowLeft,
  Users,
  Radio,
  AlertCircle
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MentorSessionPage({ params }: PageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [streamCredentials, setStreamCredentials] = useState<StartSessionResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await sessionService.getSession(sessionId);
      setSession(data);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError(err.response?.data?.error || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  /**
   * START SESSION - This is where mentor gets ingest server + stream key
   * The backend assigns a free IVS channel and creates a new stream key
   */
  const handleStartSession = async () => {
    try {
      setStarting(true);
      setError(null);
      
      // This call returns: { ingestEndpoint, streamKey, playbackUrl, channelId }
      const result = await sessionService.startSession(sessionId);
      setStreamCredentials(result);
      await loadSession(); // Refresh session status
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to start session';
      
      if (errorMessage.includes('no free channels')) {
        setError('No streaming channels available. Please contact admin or try again later.');
      } else if (errorMessage.includes('Mentor profile')) {
        setError('Your mentor profile is not set up. Please contact support.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session? Students will be disconnected.')) {
      return;
    }

    try {
      setEnding(true);
      setError(null);
      await sessionService.endSession(sessionId);
      setStreamCredentials(null);
      await loadSession();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to end session');
    } finally {
      setEnding(false);
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
    return `rtmps://${streamCredentials.ingestEndpoint}:443/app/${streamCredentials.streamKey}`;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      SCHEDULED: { variant: 'default', icon: <Calendar className="h-3 w-3 mr-1" /> },
      LIVE: { variant: 'secondary', icon: <Radio className="h-3 w-3 mr-1 animate-pulse" /> },
      ENDED: { variant: 'outline', icon: <Square className="h-3 w-3 mr-1" /> },
      CANCELLED: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    };
    const { variant, icon } = config[status] || { variant: 'default', icon: null };
    return (
      <Badge variant={variant} className="flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-white">Loading session...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!session) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/mentor/sessions')}
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
              <CardContent className="p-6">
                <p className="text-red-600 dark:text-red-400">Session not found or you don&apos;t have permission to view it.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push('/mentor/sessions')}
                className="text-gray-400 hover:text-white mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sessions
              </Button>
              <h1 className="text-3xl font-bold text-white">{session.title}</h1>
              <p className="text-gray-300 mt-1">{session.description}</p>
            </div>
            {getStatusBadge(session.status)}
          </div>

          {/* Session Info */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>{format(new Date(session.scheduledAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>{format(new Date(session.scheduledAt), 'h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span>{session.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-400" />
                  <span>{session.streamType}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Start Session Button - Only show for SCHEDULED sessions */}
          {session.status === 'SCHEDULED' && !streamCredentials && (
            <Card className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-400/30">
              <CardContent className="p-8 text-center">
                <Video className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Go Live?</h2>
                <p className="text-gray-300 mb-6">
                  Click the button below to start your session. You&apos;ll receive streaming credentials to use in OBS Studio.
                </p>
                <Button
                  size="lg"
                  onClick={handleStartSession}
                  disabled={starting}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {starting ? 'Starting Session...' : 'Start Session'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Streaming Credentials - Shown after starting session */}
          {streamCredentials && (
            <Card className="bg-green-500/10 border-green-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Radio className="h-5 w-5 animate-pulse" />
                  Session is LIVE - Streaming Credentials
                </CardTitle>
                <CardDescription className="text-green-300">
                  Use these credentials in OBS Studio to start broadcasting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full RTMPS URL */}
                <div className="bg-white/10 p-4 rounded-lg border border-green-400/30">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-white">📺 Full RTMPS URL (for OBS Server field):</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(getRtmpsUrl(), 'rtmps')}
                      className="text-green-400 hover:text-green-300"
                    >
                      {copiedField === 'rtmps' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-1">{copiedField === 'rtmps' ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                  <code className="text-sm bg-black/30 p-3 rounded block break-all text-green-400 font-mono">
                    {getRtmpsUrl()}
                  </code>
                </div>

                {/* Individual Credentials */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-300">Ingest Server:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`rtmps://${streamCredentials.ingestEndpoint}:443/app`, 'ingest')}
                        className="h-7 text-xs text-gray-400"
                      >
                        {copiedField === 'ingest' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <code className="text-xs bg-black/30 p-2 rounded block break-all text-blue-400 font-mono">
                      rtmps://{streamCredentials.ingestEndpoint}:443/app
                    </code>
                  </div>
                  
                  <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-300">Stream Key:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(streamCredentials.streamKey, 'streamKey')}
                        className="h-7 text-xs text-gray-400"
                      >
                        {copiedField === 'streamKey' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                    <code className="text-xs bg-black/30 p-2 rounded block break-all text-amber-400 font-mono">
                      {streamCredentials.streamKey}
                    </code>
                  </div>
                </div>

                {/* Playback URL */}
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-400/30">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-blue-300">👥 Playback URL (Students watch here):</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(streamCredentials.playbackUrl, 'playback')}
                      className="h-7 text-xs text-blue-400"
                    >
                      {copiedField === 'playback' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <code className="text-xs bg-black/30 p-2 rounded block break-all text-blue-400 font-mono">
                    {streamCredentials.playbackUrl}
                  </code>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleEndSession}
                    disabled={ending}
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    {ending ? 'Ending...' : 'End Session'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://obsproject.com/', '_blank')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Download OBS
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Session Controls */}
          {session.status === 'LIVE' && !streamCredentials && (
            <Card className="bg-amber-500/10 border-amber-400/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="h-6 w-6 text-amber-400 animate-pulse" />
                    <div>
                      <p className="text-white font-semibold">Session is Live</p>
                      <p className="text-gray-400 text-sm">Started at {session.startedAt ? format(new Date(session.startedAt), 'h:mm a') : 'N/A'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleEndSession}
                    disabled={ending}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    {ending ? 'Ending...' : 'End Session'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ended Session */}
          {session.status === 'ENDED' && (
            <Card className="bg-gray-500/10 border-gray-400/30">
              <CardContent className="p-6 text-center">
                <Square className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white font-semibold">Session Ended</p>
                <p className="text-gray-400 text-sm mt-1">
                  {session.endedAt ? `Ended at ${format(new Date(session.endedAt), 'h:mm a, MMM dd')}` : 'Session has ended'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* OBS Setup Instructions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Video className="h-5 w-5 text-blue-400" />
                OBS Studio Setup Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                <li>Download and install <a href="https://obsproject.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OBS Studio</a></li>
                <li>Click <strong className="text-white">&quot;Start Session&quot;</strong> above to get your streaming credentials</li>
                <li>In OBS, go to <strong className="text-white">Settings → Stream</strong></li>
                <li>Set <strong className="text-white">Service</strong> to <code className="bg-white/10 px-1 rounded">Custom</code></li>
                <li>Paste the <strong className="text-white">RTMPS URL</strong> into the Server field</li>
                <li>Leave Stream Key empty (it&apos;s included in the URL)</li>
                <li>Click <strong className="text-white">Apply</strong>, then <strong className="text-white">&quot;Start Streaming&quot;</strong> in OBS</li>
              </ol>
              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-400/30">
                <p className="text-sm text-amber-300">
                  <strong>💡 Alternative:</strong> You can also use Ingest Server + Stream Key separately if preferred.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
