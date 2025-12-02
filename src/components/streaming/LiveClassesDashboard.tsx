'use client';

/**
 * LiveClassesDashboard Component
 * 
 * Student dashboard showing all currently live classes across the platform.
 * Displays a grid of live sessions with thumbnails, mentor info, and viewer counts.
 * 
 * Features:
 * - Grid view of all live classes
 * - Class thumbnail and mentor avatar
 * - Viewer count and stream health
 * - "Join Class" button navigation
 * - Auto-refresh capability
 * - Empty state when no classes live
 * - Responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mentorChannelService, LiveClass } from '@/services/mentorChannelService';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  Video, 
  Users, 
  Radio, 
  AlertCircle,
  RefreshCw,
  Play,
  Clock,
  BookOpen
} from 'lucide-react';

interface LiveClassesDashboardProps {
  /** Auto-refresh interval in ms (default: 30000) */
  refreshInterval?: number;
  /** Callback when a class is selected */
  onClassSelect?: (classId: string) => void;
  /** Custom watch URL pattern (default: /watch/{sessionId}) */
  watchUrlPattern?: string;
}

export function LiveClassesDashboard({ 
  refreshInterval = 30000,
  onClassSelect,
  watchUrlPattern = '/watch'
}: LiveClassesDashboardProps) {
  const router = useRouter();
  
  // State
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ============================================
  // DATA FETCHING
  // ============================================
  
  const fetchLiveClasses = useCallback(async () => {
    try {
      setError(null);
      const response = await mentorChannelService.getLiveClasses();
      setLiveClasses(response.classes);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchLiveClasses, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLiveClasses, refreshInterval]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleJoinClass = (liveClass: LiveClass) => {
    if (onClassSelect) {
      onClassSelect(liveClass.classId);
    } else {
      router.push(`${watchUrlPattern}/${liveClass.sessionId}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just started';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const renderLoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className="bg-gray-900 border-gray-700">
          <div className="aspect-video bg-gray-800 rounded-t-lg">
            <Skeleton className="w-full h-full" />
          </div>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <Video className="h-16 w-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Live Classes</h3>
        <p className="text-gray-400 mb-6 max-w-md">
          There are no live classes at the moment. Check back later or browse our course catalog.
        </p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={fetchLiveClasses}
            className="border-gray-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => router.push('/courses')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Alert variant="destructive" className="bg-red-900/30 border-red-700">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Live Classes</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchLiveClasses}
          className="ml-4 border-red-600"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );

  const renderLiveClassCard = (liveClass: LiveClass) => (
    <Card 
      key={liveClass.sessionId} 
      className="bg-gray-900 border-gray-700 overflow-hidden hover:border-orange-500 transition-colors cursor-pointer group"
      onClick={() => handleJoinClass(liveClass)}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-gray-800">
        {/* Placeholder thumbnail */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-purple-500/20">
          <Video className="h-12 w-12 text-gray-500" />
        </div>

        {/* Live Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-red-600 text-white animate-pulse">
            <Radio className="h-3 w-3 mr-1" />
            LIVE
          </Badge>
        </div>

        {/* Viewer Count */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-gray-800/80 text-white">
            <Users className="h-3 w-3 mr-1" />
            {liveClass.viewerCount}
          </Badge>
        </div>

        {/* Play Overlay on Hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-orange-500 rounded-full p-4">
            <Play className="h-8 w-8 text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Class Title */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {liveClass.classTitle}
        </h3>

        {/* Mentor Info */}
        <div className="flex items-center gap-3 mb-4">
          {/* Simple Avatar */}
          {liveClass.mentorAvatar ? (
            <img 
              src={liveClass.mentorAvatar} 
              alt={liveClass.mentorName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(liveClass.mentorName)}
            </div>
          )}
          <span className="text-gray-400 text-sm">{liveClass.mentorName}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Clock className="h-4 w-4" />
            <span>{getTimeAgo(liveClass.startedAt)}</span>
          </div>
          
          {liveClass.streamHealth && (
            <Badge 
              variant={liveClass.streamHealth === 'HEALTHY' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {liveClass.streamHealth}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Radio className="h-8 w-8 text-red-500" />
            Live Classes
          </h1>
          <p className="text-gray-400 mt-1">
            {liveClasses.length > 0 
              ? `${liveClasses.length} class${liveClasses.length === 1 ? '' : 'es'} live now`
              : 'No live classes at the moment'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm hidden md:block">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            onClick={fetchLiveClasses}
            disabled={loading}
            className="border-gray-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && renderErrorState()}

      {/* Content */}
      {loading && liveClasses.length === 0 ? (
        renderLoadingSkeleton()
      ) : liveClasses.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveClasses.map(renderLiveClassCard)}
        </div>
      )}
    </div>
  );
}

export default LiveClassesDashboard;
