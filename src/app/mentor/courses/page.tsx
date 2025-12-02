'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { mentorService } from '@/services/mentorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Users, Calendar, Clock, Video, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';

interface ScheduledSession {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  duration: number;
}

interface Course {
  id: string;
  courseName: string;
  description: string | null;
  imageUrl: string;
  category: string;
  difficulty: string;
  isActive: boolean;
  enrollmentCount: number;
  scheduledSessions: ScheduledSession[];
}

export default function MentorCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.userType !== 'MENTOR') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchCourses();
    }
  }, [status, session, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('No authentication token');
      }

      console.log('Fetching mentor courses...');
      const response = await mentorService.getMyCourses(token);
      console.log('Mentor courses response:', response);
      setCourses(response.data.courses || []);
      console.log('Courses set:', response.data.courses?.length || 0);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'LIVE':
        return 'bg-red-100 text-red-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800';
      case 'EXPERT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-900 to-blue-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Courses</h1>
            <p className="text-white/80 mt-1">Manage your assigned courses and sessions</p>
          </div>
          <Link href="/mentor/sessions/schedule">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/30 backdrop-blur-md border border-blue-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Courses</p>
                  <p className="text-3xl font-bold text-white">{courses.length}</p>
                </div>
                <BookOpen className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 backdrop-blur-md border border-blue-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-white">
                    {courses.reduce((sum, course) => sum + course.enrollmentCount, 0)}
                  </p>
                </div>
                <Users className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 backdrop-blur-md border border-blue-800/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Scheduled Sessions</p>
                  <p className="text-3xl font-bold text-white">
                    {courses.reduce(
                      (sum, course) =>
                        sum +
                        course.scheduledSessions.filter((s) => s.status === 'SCHEDULED').length,
                      0
                    )}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <Card className="bg-black/30 backdrop-blur-md border border-blue-800/30">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Courses Assigned Yet</h3>
              <p className="text-white/60">
                You don&apos;t have any courses assigned to you at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="bg-black/30 backdrop-blur-md border border-blue-800/30 hover:border-orange-500/50 transition-all"
              >
                <CardHeader>
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={course.imageUrl}
                        alt={course.courseName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-white text-lg">{course.courseName}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {course.category}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.enrollmentCount} students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {course.description && (
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">{course.description}</p>
                  )}

                  {/* Upcoming Sessions */}
                  {course.scheduledSessions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Recent Sessions
                      </h4>
                      <div className="space-y-2">
                        {course.scheduledSessions.slice(0, 3).map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{session.title}</p>
                              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(session.scheduledAt).toLocaleString()} ({session.duration} min)
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/mentor/sessions?courseId=${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                        View All Sessions
                      </Button>
                    </Link>
                    <Link href={`/mentor/sessions/schedule?courseId=${course.id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="w-4 h-4 mr-1" />
                        Schedule
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
