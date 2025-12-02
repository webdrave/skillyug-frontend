'use client';

/**
 * Mentor Stream Page
 * 
 * This page provides the mentor streaming dashboard with OBS credentials.
 * Mentors can view their permanent streaming credentials and manage live classes.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MentorStreamingStudio } from '@/components/streaming/MentorStreamingStudio';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MentorStreamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get classId from URL params, or use 'general' as default for standalone streaming
  const classId = searchParams.get('classId') || 'general';
  const className = searchParams.get('className') || 'Live Class';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading streaming dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is a mentor
  const userType = (session?.user as any)?.userType;
  if (status === 'authenticated' && userType !== 'MENTOR' && userType !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6 min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Only mentors can access the streaming dashboard.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Live Streaming Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stream your classes using OBS Studio with your permanent credentials
          </p>
        </div>

        {/* Main Streaming Studio */}
        <MentorStreamingStudio 
          classId={classId}
          className={className}
          onStatusChange={(isLive) => {
            console.log('Stream status:', isLive ? 'Live' : 'Offline');
          }}
        />
      </div>
    </div>
  );
}
