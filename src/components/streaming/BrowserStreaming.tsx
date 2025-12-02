'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, VideoOff, Mic, MicOff, Monitor, Camera } from 'lucide-react';

interface BrowserStreamingProps {
  streamId: string;
  streamKey?: string;
  ingestEndpoint?: string;
  playbackUrl?: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export function BrowserStreaming({ 
  streamId, 
  streamKey, 
  ingestEndpoint, 
  playbackUrl,
  onStreamStart, 
  onStreamEnd 
}: BrowserStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<'camera' | 'screen'>('camera');
  const [useAwsIvs, setUseAwsIvs] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (err: any) {
      setError(`Failed to access camera: ${err.message}`);
      console.error('Camera error:', err);
    }
  };

  const startScreenShare = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (err: any) {
      setError(`Failed to access screen: ${err.message}`);
      console.error('Screen share error:', err);
    }
  };

  const startStreaming = async () => {
    if (!streamRef.current) {
      setError('Please start camera or screen share first');
      return;
    }

    try {
      if (streamKey && ingestEndpoint) {
        // AWS IVS streaming mode
        setError('⚠️ Browser to AWS IVS streaming requires OBS Studio or streaming software. Please use OBS with these credentials.');
        setUseAwsIvs(true);
      } else {
        // Local recording mode (development)
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000 // 2.5 Mbps
        });

        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            console.log('Recording chunk:', event.data.size, 'bytes');
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('Recording stopped, total size:', blob.size);
        };

        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
      }
      
      setIsStreaming(true);
      onStreamStart?.();
      
    } catch (err: any) {
      setError(`Failed to start streaming: ${err.message}`);
      console.error('Streaming error:', err);
    }
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    setIsStreaming(false);
    onStreamEnd?.();
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    stopStreaming();
    setIsCameraOn(false);
    setIsMicOn(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Browser Live Streaming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Source Selection */}
            {!isCameraOn && (
              <div className="flex gap-2">
                <Button
                  onClick={startCamera}
                  className="flex-1"
                  variant="outline"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
                <Button
                  onClick={startScreenShare}
                  className="flex-1"
                  variant="outline"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Share Screen
                </Button>
              </div>
            )}

            {/* Stream Controls */}
            {isCameraOn && (
              <div className="flex gap-2">
                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  size="icon"
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={toggleMic}
                  variant="outline"
                  size="icon"
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                
                {!isStreaming ? (
                  <Button
                    onClick={startStreaming}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    🔴 Go Live
                  </Button>
                ) : (
                  <Button
                    onClick={stopStreaming}
                    className="flex-1"
                    variant="destructive"
                  >
                    ⏹️ Stop Streaming
                  </Button>
                )}
                
                <Button
                  onClick={stopStream}
                  variant="outline"
                >
                  End Session
                </Button>
              </div>
            )}
          </div>

          {/* Status */}
          {isStreaming && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-semibold">LIVE</span> - Your stream is broadcasting
              </AlertDescription>
            </Alert>
          )}

          {/* AWS IVS Credentials (if available) */}
          {streamKey && ingestEndpoint && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="text-sm space-y-3">
                  <p className="font-semibold text-blue-900">AWS IVS Streaming Credentials:</p>
                  <div className="space-y-2 font-mono text-xs bg-white p-3 rounded border">
                    <div>
                      <span className="text-gray-600">Server:</span>{' '}
                      <span className="text-blue-700">{ingestEndpoint}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stream Key:</span>{' '}
                      <span className="text-blue-700">{streamKey}</span>
                    </div>
                    {playbackUrl && (
                      <div>
                        <span className="text-gray-600">Playback URL:</span>{' '}
                        <span className="text-blue-700">{playbackUrl}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-blue-800">
                    <strong>How to stream with OBS Studio:</strong>
                  </p>
                  <ol className="list-decimal ml-4 space-y-1 text-blue-900">
                    <li>Download OBS Studio from obsproject.com</li>
                    <li>Go to Settings → Stream</li>
                    <li>Service: Custom</li>
                    <li>Server: Paste the ingest endpoint above</li>
                    <li>Stream Key: Paste the stream key above</li>
                    <li>Click "Start Streaming" in OBS</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <Alert>
            <AlertDescription>
              <div className="text-sm space-y-2">
                <p><strong>Browser Streaming Options:</strong></p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Click "Start Camera" to stream your webcam, or "Share Screen" to stream your screen</li>
                  <li>Preview your video in the player above</li>
                  <li>Click "🔴 Go Live" to test recording</li>
                </ol>
                <p className="text-yellow-600 mt-2">
                  <strong>Note:</strong> Direct browser-to-AWS-IVS streaming requires OBS Studio or similar streaming software. Use the AWS IVS credentials shown above to stream via OBS.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
