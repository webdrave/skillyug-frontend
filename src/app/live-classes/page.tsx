'use client';

/**
 * Live Classes Page
 * 
 * Student dashboard showing all currently live classes.
 * Uses the LiveClassesDashboard component.
 */

import { LiveClassesDashboard } from '@/components/streaming/LiveClassesDashboard';

export default function LiveClassesPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <LiveClassesDashboard 
          refreshInterval={30000}
          watchUrlPattern="/session"
        />
      </div>
    </div>
  );
}
