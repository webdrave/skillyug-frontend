'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from "../../hooks/AuthContext";
import { LogOut, Users, BookOpen, MessageSquare, BarChart3, Video, Calendar, Radio, Key, Copy, Check, ExternalLink, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { sessionService, Session, StreamingCredentials } from '@/services/sessionService';

const MentorsDashboard = () => {
  const { signOut, profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]); // All sessions including past
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [gettingCredentials, setGettingCredentials] = useState<string | null>(null);
  const [streamCredentials, setStreamCredentials] = useState<StreamingCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load scheduled sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await sessionService.getMySessions();
        const sessionList = Array.isArray(data) ? data : [];
        setAllSessions(sessionList);
        setSessions(sessionList.filter(s => s.status === 'SCHEDULED'));
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, []);

  // Get streaming credentials for a session
  const handleGetCredentials = async (sessionId: string) => {
    try {
      setGettingCredentials(sessionId);
      const result = await sessionService.getStreamingCredentials(sessionId);
      setStreamCredentials(result);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to get credentials';
      alert(errorMessage.includes('no free channels') || errorMessage.includes('No available channels')
        ? 'No streaming channels available. Please contact admin or try again later.'
        : errorMessage);
    } finally {
      setGettingCredentials(null);
    }
  };

  // Release credentials
  const handleReleaseCredentials = async () => {
    if (!streamCredentials?.sessionId) return;
    try {
      await sessionService.releaseStreamingCredentials(streamCredentials.sessionId);
      setStreamCredentials(null);
    } catch (error) {
      console.error('Failed to release credentials:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate RTMPS URL
  const getRtmpsUrl = () => {
    if (!streamCredentials) return '';
    return `rtmps://${streamCredentials.ingestServer}:443/app/${streamCredentials.streamKey}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900/50 p-6 flex flex-col flex-shrink-0">
        <div className="mb-8">
          <Image
            src="/logo/Logo.png"
            alt="Skill Yug Logo"
            width={48}
            height={48}
            className="h-12 w-auto bg-white p-2 rounded-lg"
          />
        </div>
        <nav className="flex flex-col space-y-3 flex-grow">
          <Link href="/dashboard" className="w-full text-left p-3 bg-orange-500 rounded-lg font-semibold text-white">
            Dashboard
          </Link>
          <Link href="/mentor/courses" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <BookOpen className="h-5 w-5" />
            <span>My Courses</span>
          </Link>
          
          {/* Live Sessions Section */}
          <div className="pt-4 border-t border-blue-700/50">
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-2 px-3">Live Streaming</p>
          </div>
          <Link href="/mentor/stream" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Video className="h-5 w-5" />
            <span>📺 OBS Streaming</span>
          </Link>
          <Link href="/mentor/sessions" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Radio className="h-5 w-5" />
            <span>🔴 My Sessions</span>
          </Link>
          <Link href="/mentor/sessions/upcoming" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Clock className="h-5 w-5" />
            <span>📅 Upcoming Sessions</span>
          </Link>
          <Link href="/mentor/sessions/schedule" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5" />
            <span>Schedule Session</span>
          </Link>
          
          {/* Other Links */}
          <div className="pt-4 border-t border-blue-700/50">
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-2 px-3">Management</p>
          </div>
          <Link href="/mentor/students" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Users className="h-5 w-5" />
            <span>My Students</span>
          </Link>
          <Link href="/mentor/messages" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <MessageSquare className="h-5 w-5" />
            <span>Messages</span>
          </Link>
          <Link href="/mentor/analytics" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </Link>
        </nav>
        <div>
          <button 
            onClick={signOut}
            className="w-full text-left p-3 border border-blue-700 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mentor Dashboard</h1>
          
          {/* Welcome Message */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome, {profile?.full_name || 'Mentor'}!
            </h2>
            <p className="text-gray-300">
              Guide your students and help them achieve their learning goals.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/mentor/students" className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:border-orange-500/50 transition-all">
              <Users className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">45</h3>
              <p className="text-gray-300">My Students</p>
            </Link>
            <Link href="/mentor/courses" className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer">
              <BookOpen className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">My Courses</h3>
              <p className="text-gray-300">View assigned courses →</p>
            </Link>
            <Link href="/mentor/sessions" className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:border-red-500/50 transition-all">
              <Radio className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">Live Sessions</h3>
              <p className="text-gray-300">Start streaming →</p>
            </Link>
            <Link href="/mentor/analytics" className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:border-orange-500/50 transition-all">
              <BarChart3 className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">92%</h3>
              <p className="text-gray-300">Student Satisfaction</p>
            </Link>
          </div>

          {/* OBS Streaming Credentials Section */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-8 w-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">🎬 OBS Streaming Credentials</h3>
                <p className="text-gray-300 text-sm">Get your streaming credentials for OBS Studio</p>
              </div>
            </div>

            {streamCredentials ? (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-400 font-semibold mb-3">
                    ✅ Credentials Ready! Copy to OBS Studio:
                  </p>
                  
                  {/* RTMPS URL */}
                  <div className="bg-black/40 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">OBS Server URL (paste in Server field):</span>
                      <button
                        onClick={() => copyToClipboard(getRtmpsUrl(), 'rtmps')}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        {copiedField === 'rtmps' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedField === 'rtmps' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <code className="text-sm text-blue-400 font-mono break-all">{getRtmpsUrl()}</code>
                  </div>

                  {/* Stream Key */}
                  <div className="bg-black/40 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Stream Key:</span>
                      <button
                        onClick={() => copyToClipboard(streamCredentials.streamKey, 'key')}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        {copiedField === 'key' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedField === 'key' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <code className="text-sm text-green-400 font-mono break-all">{streamCredentials.streamKey}</code>
                  </div>

                  {/* Playback URL */}
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Playback URL (for students):</span>
                      <button
                        onClick={() => copyToClipboard(streamCredentials.playbackUrl, 'playback')}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        {copiedField === 'playback' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedField === 'playback' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <code className="text-sm text-orange-400 font-mono break-all">{streamCredentials.playbackUrl}</code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleReleaseCredentials}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                  >
                    Release Credentials
                  </button>
                  <Link
                    href={`/mentor/session/${streamCredentials.sessionId}/start`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Go to Session Page
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {loadingSessions ? (
                  <p className="text-gray-400">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-3">No scheduled sessions yet.</p>
                    <Link
                      href="/mentor/sessions/schedule"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Your First Session
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm mb-2">Select a session to get OBS credentials:</p>
                    {sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                        <div>
                          <p className="text-white font-medium">{session.title}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(session.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleGetCredentials(session.id)}
                          disabled={gettingCredentials === session.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" />
                          {gettingCredentials === session.id ? 'Getting...' : 'Get OBS Credentials'}
                        </button>
                      </div>
                    ))}
                    {sessions.length > 3 && (
                      <Link href="/mentor/sessions" className="text-purple-400 hover:text-purple-300 text-sm">
                        View all {sessions.length} sessions →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Student Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-300">John completed Module 3</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Sarah asked a question</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Mike submitted assignment</span>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🎬 Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/mentor/stream" className="w-full text-left p-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-white font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  📺 OBS Streaming Studio
                </Link>
                <Link href="/mentor/sessions" className="w-full text-left p-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-white font-semibold flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  🔴 Manage Live Sessions
                </Link>
                <Link href="/mentor/sessions/schedule" className="w-full text-left p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  📅 Schedule New Session
                </Link>
                <Link href="/mentor/courses" className="w-full text-left p-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors text-white font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  📚 View My Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorsDashboard;
