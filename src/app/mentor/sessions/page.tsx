'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { MentorStreamDashboard } from '@/components/streaming/MentorStreamDashboard';
import { MentorStreamingStudio } from '@/components/streaming/MentorStreamingStudio';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Video, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MentorSessionsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Live Streaming</h1>
              <p className="text-gray-300">Stream with OBS or manage scheduled sessions</p>
            </div>
            <Button
              onClick={() => router.push('/mentor/sessions/schedule')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Session
            </Button>
          </div>
          
          <Tabs defaultValue="obs-streaming" className="space-y-6">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="obs-streaming" className="data-[state=active]:bg-orange-500">
                <Video className="h-4 w-4 mr-2" />
                OBS Streaming
              </TabsTrigger>
              <TabsTrigger value="scheduled-sessions" className="data-[state=active]:bg-orange-500">
                <Calendar className="h-4 w-4 mr-2" />
                Scheduled Sessions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="obs-streaming">
              <MentorStreamingStudio 
                classId="general"
                className="Live Class"
                onStatusChange={(isLive) => {
                  console.log('Stream status:', isLive ? 'Live' : 'Offline');
                }}
              />
            </TabsContent>
            
            <TabsContent value="scheduled-sessions">
              <MentorStreamDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
