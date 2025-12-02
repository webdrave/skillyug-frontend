'use client'

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/AuthContext";
import dynamic from 'next/dynamic';

// Dynamically import dashboard components to avoid SSR issues
const StudentDashboard = dynamic(() => import('./dashboards/StudentDashboard'), { ssr: false });
const MentorsDashboard = dynamic(() => import('./dashboards/MentorsDashboard'), { ssr: false });

const DashboardSelector = () => {
  const { profile } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect admins to /admin instead of /dashboard
    if (profile?.user_type === "ADMIN") {
      router.push('/admin');
    }
  }, [profile, router]);
  
  // Prevent admin dashboard from showing on /dashboard route
  if (profile?.user_type === "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <p className="text-xl">Redirecting to Admin Panel...</p>
        </div>
      </div>
    );
  }
  
  if (profile?.user_type === "student") return <StudentDashboard />;
  if (profile?.user_type === "MENTOR" || profile?.user_type === "mentor") return <MentorsDashboard />;
  
  // Default fallback for students
  return <StudentDashboard />;
};

export default DashboardSelector;
