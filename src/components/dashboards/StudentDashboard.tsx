'use client'

import React, { useState } from 'react';
import { useAuth } from "../../hooks/AuthContext";
import { LogOut, Book, Gamepad, MessageSquare, TrendingUp, Clock, Target, Flame, Star } from 'lucide-react';
import Image from 'next/image';


// ## Sidebar Component Definition ##
const Sidebar = () => {
  const { signOut } = useAuth();
  
  const handleLogout = () => {
    signOut();
  };

  return (
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
        <button className="w-full text-left p-3 bg-orange-500 rounded-lg font-semibold text-white">Profile</button>
        <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">Your Course</button>
        <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">All Course</button>
        <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">Quiz/Games</button>
        <button className="w-full text-left p-3 hover:bg-blue-800 rounded-lg text-white">Contact us</button>
      </nav>
      <div>
        <button 
          onClick={handleLogout}
          className="w-full text-left p-3 border border-blue-700 hover:bg-blue-800 rounded-lg flex items-center space-x-2 text-white"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

// ## Main Content Component Definition ##
const MainContent = () => {
  const { user, profile, createProfileForCurrentUser } = useAuth();
  const [creatingProfile, setCreatingProfile] = useState(false);

  const handleCreateProfile = async () => {
    setCreatingProfile(true);
    try {
      await createProfileForCurrentUser();
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setCreatingProfile(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Image
                src={'/logo/Logo.png'}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full border-4 border-orange-500"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profile?.full_name || 'Student'}
              </h1>
              <p className="text-gray-300 mb-4">
                {profile?.email || user?.email}
              </p>
            </div>

            {!profile && (
              <button
                onClick={handleCreateProfile}
                disabled={creatingProfile}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold"
              >
                {creatingProfile ? 'Creating...' : 'Create Real Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Content based on profile availability */}
        {profile ? (
          <>
            {/* Learning Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-8 w-8 text-blue-400" />
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Total Learning Time</p>
                <p className="text-3xl font-bold text-white">0h</p>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-purple-800/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-8 w-8 text-purple-400" />
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Avg Quiz Score</p>
                <p className="text-3xl font-bold text-white">0%</p>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-orange-800/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="h-8 w-8 text-orange-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Active Days (This Month)</p>
                <p className="text-3xl font-bold text-white">0</p>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-green-800/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">Weekly Goal Progress</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-white">0%</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `0%` }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Quick Actions for real users */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:bg-black/40 transition-all duration-300">
                <Book className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">My Courses</h3>
                <p className="text-gray-300 mb-4">View and continue your enrolled courses</p>
                <button className="text-orange-500 hover:text-orange-400 font-medium">
                  View Courses →
                </button>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:bg-black/40 transition-all duration-300">
                <Gamepad className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Quiz & Games</h3>
                <p className="text-gray-300 mb-4">Test your knowledge with interactive quizzes</p>
                <button className="text-orange-500 hover:text-orange-400 font-medium">
                  Start Quiz →
                </button>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-6 hover:bg-black/40 transition-all duration-300">
                <MessageSquare className="h-12 w-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Support</h3>
                <p className="text-gray-300 mb-4">Get help from our support team</p>
                <button className="text-orange-500 hover:text-orange-400 font-medium">
                  Contact Us →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ## Main StudentDashboard Component ##
const StudentDashboard = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
      <Sidebar />
      <MainContent />
    </div>
  );
};

// Disable static generation to prevent AuthProvider issues during build
export async function getServerSideProps() {
  return {
    props: {}
  };
}

export default StudentDashboard;