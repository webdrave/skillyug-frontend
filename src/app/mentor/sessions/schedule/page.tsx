'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { SessionScheduler } from '@/components/streaming/SessionScheduler';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ScheduleSessionPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to sessions list after successful scheduling
    router.push('/mentor/sessions');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-white hover:text-blue-300 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold text-white mb-2">Schedule New Session</h1>
            <p className="text-gray-300">Create a new live streaming session for your students</p>
          </div>
          
          <SessionScheduler onSuccess={handleSuccess} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
