'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users, 
  ArrowLeft, 
  Play, 
  ExternalLink,
  BookOpen,
  MapPin,
  AlertCircle,
  Plus
} from 'lucide-react';
import { sessionService, Session, StartSessionResponse } from '@/services/sessionService';

export default function UpcomingSessionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<StartSessionResponse | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      loadSessions();
    }
  }, [status, router]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sessionService.getMySessions();
      const now = new Date();
      // Filter only scheduled sessions that are in the future or within 1 hour past, and sort by date
      const scheduledSessions = (Array.isArray(data) ? data : [])
        .filter(s => {
          if (s.status !== 'SCHEDULED') return false;
          const sessionDate = new Date(s.scheduledAt);
          // Include sessions that are upcoming or at most 1 hour overdue
          return sessionDate.getTime() > now.getTime() - (60 * 60 * 1000);
        })
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      setSessions(scheduledSessions);
    } catch (err: any) {
      console.error('Failed to load sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      setStartingSessionId(sessionId);
      const data = await sessionService.startSession(sessionId);
      setCredentials(data);
      setShowCredentialsModal(true);
      
      // Update local session status
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'LIVE' } : s
      ));
    } catch (err: any) {
      console.error('Failed to start session:', err);
      alert(err.message || 'Failed to start session');
    } finally {
      setStartingSessionId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You might want to use a toast notification here instead of alert
    alert(`${label} copied to clipboard!`);
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

  const getTimeUntilSession = (dateString: string) => {
    const now = new Date();
    const sessionDate = new Date(dateString);
    const diff = sessionDate.getTime() - now.getTime();
    
    if (diff < 0) {
      // Session is in the past
      const absDiff = Math.abs(diff);
      const minutes = Math.floor(absDiff / (1000 * 60));
      if (minutes < 60) return `${minutes}m overdue`;
      return 'Overdue';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutes`;
  };

  const isSessionSoon = (dateString: string) => {
    const now = new Date();
    const sessionDate = new Date(dateString);
    const diff = sessionDate.getTime() - now.getTime();
    // Within 1 hour (past or future)
    return Math.abs(diff) < 60 * 60 * 1000;
  };

  const isSessionOverdue = (dateString: string) => {
    const now = new Date();
    const sessionDate = new Date(dateString);
    return sessionDate.getTime() < now.getTime();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-blue-800/50 rounded-lg transition-colors text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Calendar className="h-8 w-8 text-orange-500" />
                Upcoming Sessions
              </h1>
              <p className="text-gray-300 mt-1">
                View and manage your scheduled live sessions
              </p>
            </div>
          </div>
          <Link
            href="/mentor/sessions/schedule"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Schedule New Session
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-red-200">{error}</p>
            <button
              onClick={loadSessions}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Upcoming Sessions</h2>
            <p className="text-gray-400 mb-6">
              You don&apos;t have any scheduled sessions yet. Create one to get started!
            </p>
            <Link
              href="/mentor/sessions/schedule"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="h-5 w-5" />
              Schedule Your First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 mb-6">
              <p className="text-blue-200">
                You have <span className="text-orange-500 font-bold">{sessions.length}</span> upcoming session{sessions.length !== 1 ? 's' : ''} scheduled
              </p>
            </div>

            {/* Session Cards */}
            {sessions.map((sessionItem, index) => (
              <div
                key={sessionItem.id}
                className={`bg-black/30 backdrop-blur-md border rounded-xl p-6 hover:border-orange-500/50 transition-all ${
                  isSessionOverdue(sessionItem.scheduledAt)
                    ? 'border-red-500/70 bg-red-500/10'
                    : isSessionSoon(sessionItem.scheduledAt) 
                    ? 'border-orange-500/70 bg-orange-500/10' 
                    : 'border-blue-800/30'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Session Number */}
                      <div className="bg-orange-500/20 text-orange-500 rounded-lg p-3 text-center min-w-[60px]">
                        <span className="text-2xl font-bold">#{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {sessionItem.title}
                        </h3>
                        
                        {sessionItem.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {sessionItem.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {/* Date */}
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="h-4 w-4 text-blue-400" />
                            <span>{formatDate(sessionItem.scheduledAt)}</span>
                          </div>
                          
                          {/* Time */}
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="h-4 w-4 text-green-400" />
                            <span>{formatTime(sessionItem.scheduledAt)}</span>
                          </div>
                          
                          {/* Duration */}
                          <div className="flex items-center gap-2 text-gray-300">
                            <Video className="h-4 w-4 text-purple-400" />
                            <span>{sessionItem.duration || 60} min</span>
                          </div>
                          
                          {/* Course */}
                          {sessionItem.course && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <BookOpen className="h-4 w-4 text-orange-400" />
                              <span>{sessionItem.course.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Until & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    {/* Time Until */}
                    <div className={`px-4 py-2 rounded-lg text-center ${
                      isSessionOverdue(sessionItem.scheduledAt)
                        ? 'bg-red-500 text-white'
                        : isSessionSoon(sessionItem.scheduledAt)
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-900/50 text-blue-200'
                    }`}>
                      <p className="text-xs uppercase tracking-wide opacity-80">
                        {isSessionOverdue(sessionItem.scheduledAt) ? 'Status' : 'Starts in'}
                      </p>
                      <p className="font-bold">{getTimeUntilSession(sessionItem.scheduledAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/mentor/sessions/${sessionItem.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Details
                      </Link>
                      
                      {(isSessionSoon(sessionItem.scheduledAt) || isSessionOverdue(sessionItem.scheduledAt)) && (
                        <button
                          onClick={() => handleStartSession(sessionItem.id)}
                          disabled={startingSessionId === sessionItem.id}
                          className={`px-4 py-2 text-white rounded-lg text-sm flex items-center gap-2 transition-colors font-semibold ${
                            isSessionOverdue(sessionItem.scheduledAt)
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } ${startingSessionId === sessionItem.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {startingSessionId === sessionItem.id ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isSessionOverdue(sessionItem.scheduledAt) ? 'Start Now' : 'Start Session'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Soon/Overdue Indicator */}
                {isSessionOverdue(sessionItem.scheduledAt) ? (
                  <div className="mt-4 pt-4 border-t border-red-500/30">
                    <p className="text-red-300 text-sm flex items-center gap-2">
                      <span className="animate-pulse">⚠️</span>
                      This session is overdue! Start it now or reschedule.
                    </p>
                  </div>
                ) : isSessionSoon(sessionItem.scheduledAt) && (
                  <div className="mt-4 pt-4 border-t border-orange-500/30">
                    <p className="text-orange-300 text-sm flex items-center gap-2">
                      <span className="animate-pulse">🔴</span>
                      This session is starting soon! Make sure you&apos;re ready to go live.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/mentor/stream"
            className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all flex items-center gap-3"
          >
            <Video className="h-8 w-8 text-purple-400" />
            <div>
              <h4 className="text-white font-semibold">OBS Streaming</h4>
              <p className="text-gray-400 text-sm">Get your streaming credentials</p>
            </div>
          </Link>
          
          <Link
            href="/mentor/sessions"
            className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition-all flex items-center gap-3"
          >
            <Video className="h-8 w-8 text-red-400" />
            <div>
              <h4 className="text-white font-semibold">All Sessions</h4>
              <p className="text-gray-400 text-sm">View all your sessions</p>
            </div>
          </Link>
          
          <Link
            href="/mentor/courses"
            className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4 hover:border-orange-500/50 transition-all flex items-center gap-3"
          >
            <BookOpen className="h-8 w-8 text-orange-400" />
            <div>
              <h4 className="text-white font-semibold">My Courses</h4>
              <p className="text-gray-400 text-sm">View your assigned courses</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && credentials && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-blue-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                Session is LIVE
              </h3>
              <button 
                onClick={() => setShowCredentialsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
                <p className="text-blue-200 text-sm">
                  <strong>OBS Setup:</strong> Go to Settings → Stream → Service: Custom → 
                  Paste the Server URL and Stream Key → Click Apply → Start Streaming!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Full RTMPS URL (Server)
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-black/50 border border-gray-700 rounded-lg text-sm text-gray-300 break-all font-mono">
                      {`rtmps://${credentials.ingestEndpoint}:443/app/${credentials.streamKey}`}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(`rtmps://${credentials.ingestEndpoint}:443/app/${credentials.streamKey}`, 'RTMPS URL')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Stream Key
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-black/50 border border-gray-700 rounded-lg text-sm text-gray-300 font-mono">
                      {credentials.streamKey}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(credentials.streamKey, 'Stream Key')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Playback URL (for students)
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-black/50 border border-gray-700 rounded-lg text-sm text-gray-300 break-all font-mono">
                      {credentials.playbackUrl}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(credentials.playbackUrl, 'Playback URL')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
