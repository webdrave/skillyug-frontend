'use client'

import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, TrendingUp, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { enrollmentAPI } from '@/lib/api';

interface EnrolledCourse {
  id: string;
  enrolledAt: string;
  progressPercent: number;
  lastAccessedAt: string;
  course: {
    id: string;
    courseName: string;
    imageUrl: string;
    description?: string;
    difficulty: string;
    category: string;
    durationHours?: number;
  };
}

interface EnrolledCoursesProps {
  limit?: number;
  showTitle?: boolean;
}

export const EnrolledCourses: React.FC<EnrolledCoursesProps> = ({ 
  limit = 6,
  showTitle = true 
}) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await enrollmentAPI.getMyEnrollments();
      
      if (response.status === 'success' && response.data) {
        const enrollments = Array.isArray(response.data) ? response.data : [];
        setCourses(enrollments.slice(0, limit));
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setError('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-8">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white mb-6">My Enrolled Courses</h2>
        )}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-8">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white mb-6">My Enrolled Courses</h2>
        )}
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-8">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white mb-6">My Enrolled Courses</h2>
        )}
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No Courses Enrolled Yet</p>
          <p className="text-gray-500 mb-4">Start learning by enrolling in a course</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl p-8">
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">My Enrolled Courses</h2>
          {courses.length >= limit && (
            <button
              onClick={() => router.push('/dashboard/courses')}
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              View All →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((enrollment) => (
          <div
            key={enrollment.id}
            onClick={() => handleCourseClick(enrollment.course.id)}
            className="bg-blue-900/30 border border-blue-700/50 rounded-xl overflow-hidden hover:bg-blue-900/50 transition-all duration-300 cursor-pointer group"
          >
            {/* Course Image */}
            <div className="relative h-40 overflow-hidden">
              {enrollment.course.imageUrl ? (
                <Image
                  src={enrollment.course.imageUrl}
                  alt={enrollment.course.courseName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white" />
                </div>
              )}
              {/* Progress Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
                <div className="flex items-center justify-between text-xs text-white mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{Math.round(enrollment.progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {enrollment.course.courseName}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span className="px-2 py-1 bg-blue-600/20 rounded text-blue-300">
                  {enrollment.course.difficulty}
                </span>
                {enrollment.course.durationHours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{enrollment.course.durationHours}h</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-3">
                Last accessed: {formatDate(enrollment.lastAccessedAt)}
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Play className="h-4 w-4" />
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
