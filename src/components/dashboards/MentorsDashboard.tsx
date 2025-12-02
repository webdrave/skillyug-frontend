'use client'

import React from 'react';
import { useAuth } from "../../hooks/AuthContext";
import { LogOut, Users, BookOpen, MessageSquare, BarChart3, Video, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MentorStreamingDashboard } from '../streaming/MentorStreamingDashboard';

const MentorsDashboard = () => {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900/50 p-6 flex flex-col flex-shrink-0">
        <div className="mb-8">
          <Image
            src="/logo/Logo.png"
            alt="Skill Yug Logo"
            width={48}
            height={48}
            className="h-12 w-auto bg-white p-2 rounded-lg"
          />
        </div>
        <nav className="flex flex-col space-y-3 flex-grow">
          <button className="w-full text-left p-3 bg-orange-500 rounded-lg font-semibold">Dashboard</button>
          <Link href="/mentor/courses" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <BookOpen className="h-5 w-5" />
            <span>My Courses</span>
          </Link>
          <Link href="/mentor/stream" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Video className="h-5 w-5" />
            <span>🔴 Live Streaming</span>
          </Link>
          <Link href="/mentor/sessions" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Video className="h-5 w-5" />
            <span>My Sessions</span>
          </Link>
          <Link href="/mentor/sessions/schedule" className="w-full text-left p-3 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5" />
            <span>Schedule Session</span>
          </Link>
          <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">My Students</button>
          <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">My Courses</button>
          <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">Messages</button>
          <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">Analytics</button>
        </nav>
        <div>
          <button 
            onClick={signOut}
            className="w-full text-left p-3 border border-blue-700 hover:bg-blue-800 rounded-lg flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mentor Dashboard</h1>
          
          {/* Welcome Message */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Welcome, {profile?.full_name || 'Mentor'}!
            </h2>
            <p className="text-gray-300">
              Guide your students and help them achieve their learning goals.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <Users className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">45</h3>
              <p className="text-gray-300">My Students</p>
            </div>
            <Link href="/mentor/courses" className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer">
              <BookOpen className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">My Courses</h3>
              <p className="text-gray-300">View assigned courses →</p>
            </Link>
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <MessageSquare className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">23</h3>
              <p className="text-gray-300">New Messages</p>
            </div>
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <BarChart3 className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-2xl font-bold text-white">92%</h3>
              <p className="text-gray-300">Student Satisfaction</p>
            </div>
          </div>

          {/* Live Streaming Section */}
          <div className="mb-8">
            <MentorStreamingDashboard />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Student Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-300">John completed Module 3</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Sarah asked a question</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Mike submitted assignment</span>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/mentor/courses" className="block w-full text-left p-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors text-white font-semibold">
                  📚 View My Courses
                </Link>
                <Link href="/mentor/stream" className="block w-full text-left p-3 bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-white font-semibold">
                  🔴 View Live Streaming
                </Link>
                <Link href="/mentor/sessions/schedule" className="block w-full text-left p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-white">
                  Schedule Live Session
                </Link>
                <Link href="/mentor/sessions" className="block w-full text-left p-3 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-white">
                  Manage My Sessions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Disable static generation to prevent AuthProvider issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}

export default MentorsDashboard;
