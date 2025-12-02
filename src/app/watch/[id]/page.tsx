'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { streamingService } from '@/services/streamingService';

export default function WatchStreamPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (streamId) {
      loadStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const loadStream = async () => {
    try {
      setLoading(true);
      const streamData = await streamingService.getStream(streamId);
      setStream(streamData);

      // Load AWS IVS player if we have a playback URL
      if (streamData.playbackUrl && videoRef.current) {
        loadIVSPlayer(streamData.playbackUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  const loadIVSPlayer = (playbackUrl: string) => {
    // For AWS IVS, we can use HLS.js or AWS IVS Player
    if (videoRef.current) {
      // Simple HLS playback (works in Safari natively)
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = playbackUrl;
      } else {
        // For other browsers, you'd need HLS.js
        // Import and use HLS.js here
        console.log('HLS.js required for this browser');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading stream...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{stream?.title || 'Live Stream'}</h1>
        {stream?.description && (
          <p className="text-gray-600 mt-2">{stream.description}</p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
                {stream?.status === 'LIVE' ? (
                  <>
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full"
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      LIVE
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <p className="text-xl font-semibold">Stream is offline</p>
                      <p className="text-gray-400 mt-2">
                        The stream will appear here when it goes live
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {stream?.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About this stream</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{stream.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    stream?.status === 'LIVE' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <p className="font-semibold capitalize">
                    {stream?.status?.toLowerCase() || 'Offline'}
                  </p>
                </div>
              </div>
              
              {stream?.mentor && (
                <div>
                  <p className="text-sm text-gray-600">Streamed by</p>
                  <p className="font-semibold">{stream.mentor.fullName}</p>
                </div>
              )}

              {stream?.scheduledStartTime && (
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-sm">
                    {new Date(stream.scheduledStartTime).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <p className="text-sm">
                This is a live stream. If you don't see video, the stream may not have started yet.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
