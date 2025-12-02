'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Video, StopCircle, Play, Clock, Users, Eye, EyeOff, Trash2 } from 'lucide-react';
import { streamingService, type LiveStream } from '@/services/streamingService';

export function MentorStreamingDashboard() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [currentStream, setCurrentStream] = useState<LiveStream | null>(null);
  const [streamKey, setStreamKey] = useState<string>('');
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMentorStreams();
  }, []);

  const fetchMentorStreams = async () => {
    try {
      const response = await streamingService.getMentorStreams({ limit: 10 });
      const streams = response?.streams || [];
      setStreams(streams);
      
      // Check if there's an active stream
      const activeStream = streams.find(s => s.status === 'LIVE' || s.status === 'CREATED');
      if (activeStream) {
        setCurrentStream(activeStream);
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      setStreams([]); // Set empty array on error
    }
  };

  const startStream = async (streamId: string) => {
    setLoading(true);
    try {
      const response = await streamingService.startStream(streamId);
      setCurrentStream(response.stream);
      fetchMentorStreams();
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Failed to start stream. Make sure you\'re broadcasting from OBS first.');
    } finally {
      setLoading(false);
    }
  };

  const endStream = async (streamId: string) => {
    if (!confirm('Are you sure you want to end this stream?')) return;
    
    setLoading(true);
    try {
      const response = await streamingService.endStream(streamId);
      setCurrentStream(null);
      setStreamKey('');
      fetchMentorStreams();
    } catch (error) {
      console.error('Failed to end stream:', error);
      alert('Failed to end stream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-red-500';
      case 'CREATED':
        return 'bg-yellow-500';
      case 'ENDED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Streaming</h2>
        <Badge variant="outline" className="text-white border-blue-400">
          AWS IVS Powered
        </Badge>
      </div>

      {!currentStream ? (
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardHeader>
            <CardTitle className="text-white">No Active Stream</CardTitle>
            <CardDescription className="text-gray-300">
              Schedule a session to start streaming
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-300 mb-4">
                To start live streaming, please schedule a session first. Channels are automatically assigned when you schedule a session.
              </p>
              <Button 
                onClick={() => window.location.href = '/mentor/sessions/schedule'}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule a Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Current Stream Status */}
          <Card className="bg-blue-900/30 border-blue-700/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white">{currentStream.title}</CardTitle>
                  {currentStream.description && (
                    <CardDescription className="text-gray-300 mt-1">
                      {currentStream.description}
                    </CardDescription>
                  )}
                </div>
                <Badge className={`${getStatusColor(currentStream.status)} text-white`}>
                  {currentStream.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-950/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Users className="h-4 w-4" />
                    <span>Viewers</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{currentStream.viewerCount}</p>
                </div>
                <div className="bg-blue-950/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {currentStream.status === 'LIVE' ? 'Broadcasting' : 'Ready'}
                  </p>
                </div>
              </div>

              {/* Streaming Configuration */}
              {(currentStream.status === 'CREATED' || streamKey) && (
                <div className="space-y-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-200 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    OBS Studio / Streaming Software Configuration
                  </h3>
                  <p className="text-sm text-yellow-100/80">
                    Use these settings in your streaming software before starting the stream:
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-yellow-200">Server (RTMPS URL):</label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value={currentStream.ingestEndpoint} 
                          readOnly 
                          className="bg-blue-950/50 border-blue-700 text-white font-mono text-sm"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(currentStream.ingestEndpoint, 'Server URL')}
                          className="border-yellow-700 text-yellow-200 hover:bg-yellow-900/30"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {streamKey && (
                      <div>
                        <label className="text-sm font-medium text-yellow-200">Stream Key:</label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            type={showStreamKey ? 'text' : 'password'}
                            value={streamKey} 
                            readOnly 
                            className="bg-blue-950/50 border-blue-700 text-white font-mono text-sm"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowStreamKey(!showStreamKey)}
                            className="border-yellow-700 text-yellow-200 hover:bg-yellow-900/30"
                          >
                            {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(streamKey, 'Stream Key')}
                            className="border-yellow-700 text-yellow-200 hover:bg-yellow-900/30"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          ⚠️ Keep this private! Never share your stream key publicly.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {currentStream.status === 'CREATED' && (
                  <Button 
                    onClick={() => startStream(currentStream.id)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {loading ? 'Starting...' : 'Start Broadcasting'}
                  </Button>
                )}
                {currentStream.status === 'LIVE' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => endStream(currentStream.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    {loading ? 'Ending...' : 'End Stream'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stream History */}
      {streams.length > 0 && (
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardHeader>
            <CardTitle className="text-white">Your Streams</CardTitle>
            <CardDescription className="text-gray-300">
              View your past and scheduled streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {streams.slice(0, 5).filter(stream => stream && stream.id).map((stream) => (
                <div 
                  key={stream.id}
                  className="flex items-center justify-between p-4 bg-blue-950/50 rounded-lg border border-blue-800/30"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{stream.title || 'Untitled Stream'}</h4>
                    <p className="text-sm text-gray-400">
                      {stream.createdAt ? new Date(stream.createdAt).toLocaleDateString() : 'Unknown date'} • {stream.viewerCount || 0} viewers
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(stream.status)} text-white`}>
                    {stream.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
