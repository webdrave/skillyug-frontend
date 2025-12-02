'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BrowserStreaming } from '@/components/streaming/BrowserStreaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { streamingService } from '@/services/streamingService';

export default function MentorStreamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStream, setCurrentStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      loadOrCreateStream();
    }
  }, [status, router]);

  const loadOrCreateStream = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading streams...');
      // Try to get active stream
      const streams = await streamingService.getMentorStreams();
      console.log('Streams received:', streams);
      
      const activeStream = Array.isArray(streams) ? streams.find((s: any) => s.status === 'LIVE' || s.status === 'READY') : null;
      
      if (activeStream) {
        console.log('Found active stream:', activeStream);
        setCurrentStream(activeStream);
      } else {
        console.log('Creating new stream...');
        // Create a new stream
        const response = await streamingService.createStream({
          title: `${session?.user?.name || 'Mentor'}'s Live Stream`,
          description: 'Browser-based live streaming session',
          scheduledAt: new Date().toISOString()
        });
        console.log('New stream created:', response);
        // Extract stream data and add streamKey from response
        const streamWithKey = {
          ...response.stream,
          streamKey: response.streamKey
        };
        setCurrentStream(streamWithKey);
      }
    } catch (error: any) {
      console.error('Failed to load stream:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || 'Failed to initialize streaming');
    } finally {
      setLoading(false);
    }
  };

  const handleStreamStart = async () => {
    if (currentStream) {
      try {
        await streamingService.startStream(currentStream.id);
        console.log('Stream started on server');
      } catch (error) {
        console.error('Failed to start stream:', error);
      }
    }
  };

  const handleStreamEnd = async () => {
    if (currentStream) {
      try {
        await streamingService.endStream(currentStream.id);
        console.log('Stream ended on server');
        // Create a new stream for next time
        loadOrCreateStream();
      } catch (error) {
        console.error('Failed to stop stream:', error);
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading streaming setup...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('Stream page state:', { status, loading, currentStream });

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Live Streaming Studio</h1>
        <p className="text-gray-600 mt-2">
          Stream directly from your browser to your students
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
          <button 
            onClick={() => loadOrCreateStream()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {currentStream ? (
            <BrowserStreaming
              streamId={currentStream.id}
              streamKey={currentStream.streamKey}
              ingestEndpoint={currentStream.ingestEndpoint}
              playbackUrl={currentStream.playbackUrl}
              onStreamStart={handleStreamStart}
              onStreamEnd={handleStreamEnd}
            />
          ) : !loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">
                  Failed to initialize stream. Please refresh the page.
                </p>
                <button 
                  onClick={() => loadOrCreateStream()}
                  className="mt-4 mx-auto block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Try Again
                </button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentStream ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Stream ID</p>
                    <p className="font-mono text-xs">{currentStream.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-semibold">{currentStream.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold capitalize">{currentStream.status?.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm">
                      {new Date(currentStream.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {currentStream.playbackUrl && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">Viewer Link</p>
                      <a 
                        href={`/watch/${currentStream.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline break-all"
                      >
                        {window.location.origin}/watch/{currentStream.id}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No stream available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>✅ Use a good webcam and microphone</li>
                <li>✅ Ensure good lighting</li>
                <li>✅ Check your internet connection</li>
                <li>✅ Close unnecessary browser tabs</li>
                <li>✅ Test before going live</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
