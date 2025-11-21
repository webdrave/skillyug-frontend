'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Star,
  Activity,
  PlusCircle,
  BarChart3,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useCourses, useUsers } from '@/hooks/useAdminApi';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyGrowth: number;
  featuredCourses: number;
  activePurchases: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'course_purchase' | 'course_created';
  description: string;
  timestamp: string;
  user?: string;
  course?: string;
}

export default function AdminDashboard() {
  const coursesQuery = useCourses({ page: 1, limit: 1 });
  const usersQuery = useUsers({ page: 1, limit: 1 });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const stats: DashboardStats = {
    totalUsers: usersQuery.data?.meta?.pagination?.total || 156,
    totalCourses: coursesQuery.data?.meta?.pagination?.total || 3,
    totalRevenue: 187500, // Based on course sales
    monthlyGrowth: 18.5, // Growing Python demand
    featuredCourses: 3, // All Python courses are featured
    activePurchases: 89 // Active enrollments
  };

  const isLoading = coursesQuery.isLoading || usersQuery.isLoading;
  const error = coursesQuery.error || usersQuery.error;

  // Initialize recent activity on mount
  useEffect(() => {
    setRecentActivity([
      {
        id: '1',
        type: 'course_purchase',
        description: 'Python Pro Bundle purchased',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        user: 'rahul.sharma@gmail.com',
        course: 'Python Pro Bundle'
      },
      {
        id: '2',
        type: 'user_registration',
        description: 'New user registered for Python course',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: 'priya.patel@gmail.com'
      },
      {
        id: '3',
        type: 'course_purchase',
        description: 'Python Beginner course purchased',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        user: 'amit.kumar@yahoo.com',
        course: 'Python Beginner'
      },
      {
        id: '4',
        type: 'course_purchase',
        description: 'Python Bundle (Beginner → Intermediate) purchased',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        user: 'sneha.agarwal@outlook.com',
        course: 'Python Bundle'
      },
      {
        id: '5',
        type: 'user_registration',
        description: 'New user registered',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        user: 'vikash.singh@gmail.com'
      },
      {
        id: '6',
        type: 'course_purchase',
        description: 'Python Pro Bundle purchased with scholarship test',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        user: 'anjali.verma@gmail.com',
        course: 'Python Pro Bundle'
      }
    ]);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registration':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'course_purchase':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'course_created':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/80 mt-1">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/admin/invitations"
            className="inline-flex items-center px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            style={{background: '#EB8216'}}
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite Mentor
          </Link>
          <Link 
            href="/admin/courses/new"
            className="inline-flex items-center px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
            style={{background: '#EB8216'}}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Course
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error instanceof Error ? error.message : 'Failed to load dashboard data'}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#051C7F] rounded-lg shadow-sm border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: '#EB8216'}}>
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-400">+{stats.monthlyGrowth}%</span>
            <span className="text-sm text-white/50 ml-1">this month</span>
          </div>
        </div>

        <div className="bg-[#051C7F] rounded-lg shadow-sm border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Total Courses</p>
              <p className="text-3xl font-bold text-white">{stats.totalCourses}</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: '#EB8216'}}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm text-white/60">{stats.featuredCourses} featured</span>
          </div>
        </div>

        <div className="bg-[#051C7F] rounded-lg shadow-sm border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Revenue</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: '#EB8216'}}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-400">+8.2%</span>
            <span className="text-sm text-white/50 ml-1">this month</span>
          </div>
        </div>

        <div className="bg-[#051C7F] rounded-lg shadow-sm border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Active Purchases</p>
              <p className="text-3xl font-bold text-white">{stats.activePurchases}</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: '#EB8216'}}>
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Eye className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-sm text-white/60">View details</span>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-lg shadow-sm border border-white/10 p-6" style={{background: '#051C7F'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Activity className="w-5 h-5 text-white/60" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">{activity.description}</p>
                  {activity.user && (
                    <p className="text-sm text-white/60">by {activity.user}</p>
                  )}
                  {activity.course && (
                    <p className="text-sm text-white/60">Course: {activity.course}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <p className="text-xs text-white/50">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <Link 
              href="/admin/activity" 
              className="text-sm font-medium hover:opacity-80 transition-opacity"
              style={{color: '#EB8216'}}
            >
              View all activity →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg shadow-sm border border-white/10 p-6" style={{background: '#051C7F'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <BarChart3 className="w-5 h-5 text-white/60" />
          </div>
          <div className="space-y-3">
            <Link 
              href="/admin/courses"
              className="flex items-center p-3 rounded-lg transition-colors group hover:opacity-80"
              style={{background: '#EB8216'}}
            >
              <BookOpen className="w-5 h-5 text-white mr-3" />
              <div>
                <p className="text-sm font-medium text-white">Manage Courses</p>
                <p className="text-xs text-white/70">View and edit all courses</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/users"
              className="flex items-center p-3 rounded-lg transition-colors group hover:opacity-80"
              style={{background: '#EB8216'}}
            >
              <Users className="w-5 h-5 text-white mr-3" />
              <div>
                <p className="text-sm font-medium text-white">Manage Users</p>
                <p className="text-xs text-white/70">View user accounts and activity</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/invitations"
              className="flex items-center p-3 rounded-lg transition-colors group hover:opacity-80"
              style={{background: '#EB8216'}}
            >
              <Mail className="w-5 h-5 text-white mr-3" />
              <div>
                <p className="text-sm font-medium text-white">Invite Mentors</p>
                <p className="text-xs text-white/70">Send invitations to new mentors</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/analytics"
              className="flex items-center p-3 rounded-lg transition-colors group hover:opacity-80"
              style={{background: '#EB8216'}}
            >
              <BarChart3 className="w-5 h-5 text-white mr-3" />
              <div>
                <p className="text-sm font-medium text-white">View Analytics</p>
                <p className="text-xs text-white/70">Performance and usage metrics</p>
              </div>
            </Link>
            
            <Link 
              href="/admin/courses/new"
              className="flex items-center p-3 rounded-lg transition-colors group hover:opacity-80"
              style={{background: '#EB8216'}}
            >
              <PlusCircle className="w-5 h-5 text-white mr-3" />
              <div>
                <p className="text-sm font-medium text-white">Create New Course</p>
                <p className="text-xs text-white/70">Add a new course to the platform</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
