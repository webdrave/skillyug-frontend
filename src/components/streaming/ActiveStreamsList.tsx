'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Video, Loader2, PlayCircle } from 'lucide-react';
import { streamingService, type LiveClass } from '@/services/streamingService';
import { StudentStreamViewer } from './StudentStreamViewer';

export function ActiveStreamsList() {
  const [streams, setStreams] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveStreams();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveStreams = async () => {
    try {
      const response = await streamingService.getLiveClasses();
      setStreams(response.classes || []);
    } catch (error) {
      console.error('Failed to fetch active streams:', error);
      setStreams([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  if (selectedStream) {
    return (
      <StudentStreamViewer 
        streamId={selectedStream} 
        onBack={() => setSelectedStream(null)}
      />
    );
  }

  if (loading) {
    return (
      <Card className="bg-blue-900/30 border-blue-700/50">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </CardContent>
      </Card>
    );
  }

  if (!streams || streams.length === 0) {
    return (
      <Card className="bg-blue-900/30 border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-white">Live Classes</CardTitle>
          <CardDescription className="text-gray-300">
            No live streams at the moment
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Video className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Check back later for live classes from your mentors</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-900/30 border-blue-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Live Classes</CardTitle>
            <CardDescription className="text-gray-300">
              Join your mentors&apos; live sessions
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-red-500 border-red-500">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            {streams.length} LIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {streams.map((stream) => (
            <div
              key={stream.sessionId}
              className="p-4 bg-blue-950/50 border border-blue-800/30 rounded-lg hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail or placeholder */}
                <div className="relative w-40 h-24 bg-gradient-to-br from-orange-500/20 to-blue-500/20 rounded-lg flex-shrink-0 overflow-hidden">
                  {stream.courseImage ? (
                    <img 
                      src={stream.courseImage} 
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                    LIVE
                  </Badge>
                </div>

                {/* Stream Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-lg mb-1 truncate">
                    {stream.title}
                  </h3>
                  {stream.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Users className="h-4 w-4" />
                      <span>{stream.viewerCount} watching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {stream.mentorName?.[0] || 'M'}
                      </div>
                      <span className="text-gray-300">
                        {stream.mentorName}
                      </span>
                    </div>
                  </div>

                  {stream.courseName && (
                    <p className="text-xs text-gray-500 mt-2">
                      Course: {stream.courseName}
                    </p>
                  )}
                </div>

                {/* Join Button */}
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => setSelectedStream(stream.sessionId)}
                    className="bg-orange-500 hover:bg-orange-600"
                    size="lg"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
