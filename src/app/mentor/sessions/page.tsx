'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { MentorStreamDashboard } from '@/components/streaming/MentorStreamDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
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
              <h1 className="text-3xl font-bold text-white mb-2">My Live Sessions</h1>
              <p className="text-gray-300">Manage your scheduled sessions and start live classes</p>
            </div>
            <Button
              onClick={() => router.push('/mentor/sessions/schedule')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Session
            </Button>
          </div>
          
          <MentorStreamDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}
