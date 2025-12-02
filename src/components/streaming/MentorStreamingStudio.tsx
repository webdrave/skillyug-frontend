'use client';

/**
 * MentorStreamingStudio Component
 * 
 * Complete mentor dashboard for live streaming with OBS Studio.
 * Implements the ONE-CHANNEL-PER-MENTOR architecture for cost optimization.
 * 
 * Features:
 * - Permanent streaming credentials display
 * - Copy-to-clipboard for OBS configuration
 * - OBS setup instructions with visual guide
 * - Go Live / End Class controls
 * - Real-time stream status monitoring
 * - Viewer count display
 * 
 * Flow:
 * 1. Mentor gets credentials on component mount
 * 2. Mentor configures OBS with credentials
 * 3. Mentor starts streaming in OBS
 * 4. Mentor clicks "Go Live" button
 * 5. Students can now watch via playback URL
 * 6. Mentor clicks "End Class" when done
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  mentorChannelService, 
  MentorChannelCredentials, 
  StreamStatus 
} from '@/services/mentorChannelService';

// UI Components (assuming shadcn/ui)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Icons
import { 
  Video, 
  Copy, 
  Check, 
  Play, 
  Square, 
  Users, 
  Radio, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Monitor,
  Key,
  Server,
  Link2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MentorStreamingStudioProps {
  /** The course/class ID for this streaming session */
  classId: string;
  /** Display name for the class */
  className?: string;
  /** Callback when streaming status changes */
  onStatusChange?: (isLive: boolean) => void;
}

export function MentorStreamingStudio({ 
  classId, 
  className: classNameProp,
  onStatusChange 
}: MentorStreamingStudioProps) {
  // ============================================
  // STATE
  // ============================================
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState<MentorChannelCredentials | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goingLive, setGoingLive] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [regeneratingKey, setRegeneratingKey] = useState(false);

  // User info
  const userId = (session?.user as any)?.id;
  const userName = (session?.user as any)?.name || (session?.user as any)?.fullName;

  // ============================================
  // FETCH CREDENTIALS ON MOUNT
  // ============================================
  useEffect(() => {
    if (userId) {
      fetchCredentials();
    }
  }, [userId]);

  // ============================================
  // POLL STREAM STATUS WHEN LIVE
  // ============================================
  useEffect(() => {
    if (!userId || !activeSessionId) return;

    // Poll every 10 seconds while live
    const interval = setInterval(() => {
      checkStreamStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId, activeSessionId]);

  // ============================================
  // API CALLS
  // ============================================
  
  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const creds = await mentorChannelService.getMentorChannel(userId, userName);
      setCredentials(creds);
      
      // Check if already streaming
      await checkStreamStatus();
      
    } catch (err: any) {
      setError(err.message || 'Failed to load streaming credentials');
    } finally {
      setLoading(false);
    }
  };

  const checkStreamStatus = async () => {
    try {
      const status = await mentorChannelService.getStreamStatus(userId);
      setStreamStatus(status);
      
      // Notify parent of status change
      if (onStatusChange && status.isLive !== !!activeSessionId) {
        onStatusChange(status.isLive);
      }
    } catch (err) {
      console.error('Failed to check stream status:', err);
    }
  };

  const handleGoLive = async () => {
    try {
      setGoingLive(true);
      setError(null);
      
      const result = await mentorChannelService.startClass(
        classId,
        userId,
        classNameProp
      );
      
      setActiveSessionId(result.sessionId);
      setStreamStatus({
        isLive: true,
        viewerCount: result.viewerCount,
        streamHealth: result.streamHealth,
      });
      
      onStatusChange?.(true);
      
    } catch (err: any) {
      setError(err.message || 'Failed to go live. Make sure OBS is streaming first.');
    } finally {
      setGoingLive(false);
    }
  };

  const handleEndClass = async () => {
    if (!activeSessionId) return;
    
    if (!confirm('Are you sure you want to end this class?')) return;
    
    try {
      setEndingClass(true);
      setError(null);
      
      await mentorChannelService.endClass(activeSessionId);
      
      setActiveSessionId(null);
      setStreamStatus({ isLive: false, viewerCount: 0 });
      
      onStatusChange?.(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to end class');
    } finally {
      setEndingClass(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Regenerating your stream key will invalidate the old one. You will need to update OBS. Continue?')) {
      return;
    }
    
    try {
      setRegeneratingKey(true);
      setError(null);
      
      const result = await mentorChannelService.regenerateStreamKey(userId);
      
      if (credentials) {
        setCredentials({
          ...credentials,
          streamKey: result.streamKey,
        });
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate stream key');
    } finally {
      setRegeneratingKey(false);
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  /** Generate the full RTMPS URL for OBS Server field */
  const getObsServerUrl = () => {
    if (!credentials) return '';
    return credentials.streamUrl || `rtmps://${credentials.ingestEndpoint}:443/app/`;
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-300">Loading streaming credentials...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !credentials) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4"
            onClick={fetchCredentials}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Live Status Banner */}
      {streamStatus?.isLive && activeSessionId && (
        <Alert className="bg-red-900/30 border-red-500">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <AlertTitle className="text-red-400 flex items-center gap-2">
            🔴 YOU ARE LIVE
          </AlertTitle>
          <AlertDescription className="text-red-200">
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {streamStatus.viewerCount} watching
              </span>
              {streamStatus.streamHealth && (
                <Badge variant={streamStatus.streamHealth === 'HEALTHY' ? 'default' : 'destructive'}>
                  {streamStatus.streamHealth}
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Streaming Credentials Card */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-6 w-6 text-orange-500" />
                Live Streaming Studio
              </CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                Your permanent streaming credentials for OBS Studio
              </CardDescription>
            </div>
            
            {/* Live/Offline Status Badge */}
            <Badge 
              variant={streamStatus?.isLive ? 'destructive' : 'secondary'}
              className={streamStatus?.isLive ? 'animate-pulse' : ''}
            >
              {streamStatus?.isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {credentials && (
            <>
              {/* Quick Copy Section - Full RTMPS URL */}
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-green-400 font-semibold flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    OBS Quick Setup (Copy this to Server field)
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(getObsServerUrl(), 'server')}
                  >
                    {copiedField === 'server' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <code className="text-sm bg-gray-800 p-3 rounded block break-all text-green-300 font-mono">
                  {getObsServerUrl()}
                </code>
              </div>

              {/* Credentials Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Server URL */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Ingest Server
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.ingestEndpoint, 'ingest')}
                    >
                      {copiedField === 'ingest' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-gray-300 break-all block">
                    {credentials.ingestEndpoint}
                  </code>
                </div>

                {/* Stream Key */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Stream Key (Secret!)
                    </label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credentials.streamKey, 'key')}
                      >
                        {copiedField === 'key' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerateKey}
                        disabled={regeneratingKey}
                        title="Regenerate stream key"
                      >
                        <RefreshCw className={`h-4 w-4 ${regeneratingKey ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <code className="text-sm text-orange-300 break-all block font-mono">
                    {credentials.streamKey}
                  </code>
                </div>

                {/* Playback URL (for sharing) */}
                <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-gray-400 text-sm flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Playback URL (for students)
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.playbackUrl, 'playback')}
                    >
                      {copiedField === 'playback' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-blue-300 break-all block">
                    {credentials.playbackUrl}
                  </code>
                </div>
              </div>

              <div className="border-t border-gray-700 my-6" />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {!activeSessionId ? (
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleGoLive}
                    disabled={goingLive}
                  >
                    {goingLive ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Going Live...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Go Live
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleEndClass}
                    disabled={endingClass}
                  >
                    {endingClass ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Ending...
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-5 w-5" />
                        End Class
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => checkStreamStatus()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </Button>

                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  onClick={() => window.open('https://obsproject.com/download', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Download OBS
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* OBS Setup Instructions */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <CardTitle className="text-blue-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              OBS Studio Setup Instructions
            </span>
            {showInstructions ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </CardTitle>
        </CardHeader>
        
        {showInstructions && (
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Open OBS Settings</h4>
                    <p className="text-gray-400 text-sm">
                      Open OBS Studio → Settings → Stream
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Select Service</h4>
                    <p className="text-gray-400 text-sm">
                      Service: <span className="text-orange-400">Custom...</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Paste Server URL</h4>
                    <p className="text-gray-400 text-sm">
                      Copy the <span className="text-green-400">Server URL</span> above and paste it in the Server field
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Paste Stream Key</h4>
                    <p className="text-gray-400 text-sm">
                      Copy the <span className="text-orange-400">Stream Key</span> above and paste it
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    5
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Start Streaming</h4>
                    <p className="text-gray-400 text-sm">
                      Click <span className="text-green-400">&quot;Start Streaming&quot;</span> in OBS
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0">
                    6
                  </span>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Go Live Here</h4>
                    <p className="text-gray-400 text-sm">
                      Click <span className="text-red-400">&quot;Go Live&quot;</span> button above to start the class
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-400">Important Notes</AlertTitle>
              <AlertDescription className="text-yellow-200 text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Your stream key is permanent - save these settings in OBS for future sessions</li>
                  <li>Always start OBS streaming BEFORE clicking &quot;Go Live&quot;</li>
                  <li>Never share your stream key with anyone</li>
                  <li>Recommended: 720p @ 30fps, 2500-4000 kbps bitrate</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default MentorStreamingStudio;
