'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Search, 
  UserPlus, 
  BookOpen, 
  User,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { adminCourseAPI, AdminCourse } from '@/utils/apiAdmin';
import { mentorService, MentorProfile } from '@/services/mentorService';

interface MentorWithUser extends MentorProfile {
  coursesCount?: number;
}

export default function AssignMentorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [mentors, setMentors] = useState<MentorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [searchCourse, setSearchCourse] = useState('');
  const [searchMentor, setSearchMentor] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<MentorWithUser | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Fetch courses and mentors
  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Fetch courses
      const coursesResponse = await adminCourseAPI.getAll({ page: 1, limit: 100 });
      if (coursesResponse.status === 'success') {
        setCourses(coursesResponse.data || []);
      }

      // Fetch mentors
      const mentorsResponse = await mentorService.getMentors({ page: 1, limit: 100 });
      if (mentorsResponse.status === 'success') {
        setMentors(mentorsResponse.data.mentors || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.accessToken]);

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.userType !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  const handleAssignMentor = async () => {
    if (!selectedCourse || !selectedMentor) {
      setError('Please select both a course and a mentor');
      return;
    }

    setActionLoading(selectedCourse.id);
    setError('');
    setSuccess('');

    try {
      const token = session?.user?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Update course with new mentor
      await adminCourseAPI.update(selectedCourse.id, {
        mentorId: selectedMentor.userId,
      });

      setSuccess(`Successfully assigned ${selectedMentor.user.fullName} to ${selectedCourse.courseName}`);
      
      // Refresh data
      await fetchData();
      
      // Reset selection
      setSelectedCourse(null);
      setSelectedMentor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign mentor');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchCourse.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchCourse.toLowerCase());
    const matchesCategory = !filterCategory || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter mentors
  const filteredMentors = mentors.filter(mentor => {
    const searchLower = searchMentor.toLowerCase();
    return (
      mentor.user.fullName?.toLowerCase().includes(searchLower) ||
      mentor.user.email?.toLowerCase().includes(searchLower) ||
      mentor.expertise.some(exp => exp.toLowerCase().includes(searchLower))
    );
  });

  // Get unique categories
  const categories = Array.from(new Set(courses.map(c => c.category)));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assign Mentor to Course</h1>
        <p className="text-gray-600">
          Select a course and a mentor to assign them together
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Course
              </CardTitle>
              <CardDescription>
                {selectedCourse ? 'Selected course' : 'Choose a course to assign'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchCourse}
                    onChange={(e) => setSearchCourse(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No courses found
                  </p>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedCourse?.id === course.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium text-sm text-gray-900 mb-1">
                        {course.courseName}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {course.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty}
                        </Badge>
                      </div>
                      {course.mentor && (
                        <p className="text-xs text-gray-600">
                          Current: {course.mentor.name || course.mentor.email}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Action */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <ArrowRight className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              
              <Button
                onClick={handleAssignMentor}
                disabled={!selectedCourse || !selectedMentor || !!actionLoading}
                className="w-full"
                size="lg"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Mentor
                  </>
                )}
              </Button>

              {selectedCourse && selectedMentor && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Assignment Preview
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>
                      <strong>Course:</strong> {selectedCourse.courseName}
                    </p>
                    <p>
                      <strong>Mentor:</strong> {selectedMentor.user.fullName}
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={fetchData}
                className="w-full mt-3"
                size="sm"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Mentor Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Mentor
              </CardTitle>
              <CardDescription>
                {selectedMentor ? 'Selected mentor' : 'Choose a mentor to assign'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search mentors..."
                    value={searchMentor}
                    onChange={(e) => setSearchMentor(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Mentor List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredMentors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No mentors found
                  </p>
                ) : (
                  filteredMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      onClick={() => setSelectedMentor(mentor)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedMentor?.id === mentor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {mentor.user.image ? (
                            <img
                              src={mentor.user.image}
                              alt={mentor.user.fullName || 'Mentor'}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {mentor.user.fullName || 'Unknown'}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {mentor.user.email}
                          </p>
                          {mentor.expertise.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {mentor.expertise.slice(0, 3).map((exp, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {exp}
                                </Badge>
                              ))}
                              {mentor.expertise.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{mentor.expertise.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          {mentor.experience && (
                            <p className="text-xs text-gray-500 mt-1">
                              {mentor.experience} years exp.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{mentors.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unassigned Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(c => !c.mentorId).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
