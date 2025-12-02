'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../hooks/AuthContext';
import Navbar from '../../components/Navbar';
import { BookOpen, Clock, Users, Star, Filter, Search, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { courseAPI, purchaseAPI, type Course } from '@/lib/api';

enum Category {
	Programming = "PROGRAMMING",
	Web_Development = "WEB_DEVELOPMENT",
	Mobile_Development = "MOBILE_DEVELOPMENT",
	Data_Science = "DATA_SCIENCE",
	Artificial_Intelligence = "ARTIFICIAL_INTELLIGENCE",
	Cloud_Computing = "CLOUD_COMPUTING",
	Cybersecurity = "CYBERSECURITY",
	Design = "DESIGN",
	Business = "BUSINESS",
	Marketing = "MARKETING",
	Other = "OTHER",
}

enum Difficulty {
	Beginner = "BEGINNER",
	Intermediate = "INTERMEDIATE",
	Advanced = "ADVANCED",
	Expert = "EXPERT",
}

export default function Courses() {
  const router = useRouter();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getAll();
        console.log('=== COURSES API DEBUG ===');
        console.log('Full Response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null');
        console.log('Response.status:', response?.status);
        console.log('Response.data type:', response?.data ? typeof response.data : 'undefined');
        console.log('Response.data:', response?.data);
        console.log('Is response.data an array?', Array.isArray(response?.data));
        console.log('Response.data length:', response?.data?.length);
        
        // Backend returns { status: 'success', data: [...], meta: {...} }
        // apiHelpers.get returns response.data, which IS this object
        if (response?.status === 'success' && Array.isArray(response?.data) && response.data.length > 0) {
          console.log('✅ Setting courses with', response.data.length, 'items');
          setCourses(response.data);
          setFilteredCourses(response.data);
        } else if (response?.status === 'success' && Array.isArray(response?.data)) {
          console.log('⚠️ Response successful but no courses found');
          toast('No courses available at the moment.', {
            icon: '📚',
            duration: 3000
          });
        } else {
          console.log('❌ Unexpected response structure');
          console.log('Condition check:', {
            hasResponse: !!response,
            status: response?.status,
            hasData: !!response?.data,
            isArray: Array.isArray(response?.data),
            length: response?.data?.length
          });
          toast('No courses available at the moment.', {
            icon: '📚',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('❌ Error fetching courses:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        toast.error('Failed to fetch courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  // Filter courses based on search term, category, and difficulty
  useEffect(() => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedCategory, selectedDifficulty]);

	const handleEnrollClick = async (course: Course) => {
		if (!user) {
			toast.error('Please login to enroll in courses');
			router.push('/login?redirect=' + encodeURIComponent(`/courses`));
			return;
		}

		// Check if course is free (price = 0)
		// Convert to number to handle Decimal type from database
		const coursePrice = Number(course.price);
		
		if (coursePrice === 0) {
			try {
				toast.loading('Enrolling in free course...', { id: 'enroll' });
				const response = await purchaseAPI.enrollFree(course.id);
				
				if (response.status === 'success') {
					toast.success('Successfully enrolled! Redirecting to dashboard...', { id: 'enroll' });
					setTimeout(() => router.push('/dashboard'), 1500);
				} else {
					toast.error(response.message || 'Failed to enroll', { id: 'enroll' });
				}
			} catch (error) {
				console.error('Free enrollment failed:', error);
				toast.error('Failed to enroll. Please try again.', { id: 'enroll' });
			}
			return;
		}

		// Redirect to payment page for paid courses
		router.push(`/payment?courseId=${course.id}&amount=${course.price}`);
	};  return (
		<div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800">
			<Navbar />
			<div className="py-14 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<div className="text-center mb-12">
						<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Courses</h1>
						<p className="text-xl text-gray-300 max-w-2xl mx-auto">
							Discover a wide range of courses designed to help you master new skills and advance
							your career.
						</p>
					</div>

					{/* Filters */}
					<div className="mb-8 space-y-4">
						{/* Search Bar */}
						<div className="relative max-w-md mx-auto">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
							<input
								type="text"
								placeholder="Search courses..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-3 bg-black/30 border border-blue-800/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
							/>
						</div>

						{/* Category and Difficulty Filters */}
						<div className="flex flex-wrap gap-4 justify-center">
							<div className="flex items-center space-x-2">
								<Filter className="h-5 w-5 text-gray-400" />
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									className="bg-black/30 border border-blue-800/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
								>
									<option value="all">All Categories</option>
									{Object.values(Category).map((category) => (
										<option key={category} value={category}>
											{category.replace(/_/g, " ")}
										</option>
									))}
								</select>
							</div>

							<select
								value={selectedDifficulty}
								onChange={(e) => setSelectedDifficulty(e.target.value)}
								className="bg-black/30 border border-blue-800/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
							>
								<option value="all">All Levels</option>
								{Object.values(Difficulty).map((difficulty) => (
									<option key={difficulty} value={difficulty}>
										{difficulty}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Loading State */}
					{loading ? (
						<div className="flex justify-center items-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
						</div>
					) : (
						<>
							{/* Results Count */}
							<div className="text-center mb-6">
								<p className="text-gray-300">
									Showing {filteredCourses.length} of {courses.length} courses
								</p>
							</div>

							{/* Courses Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
								{filteredCourses.length > 0 ? (
									filteredCourses.map((course) => (
										<div
											key={course.id}
											className="bg-black/30 backdrop-blur-md border border-blue-800/30 rounded-xl overflow-hidden hover:bg-black/40 transition-all duration-300 transform hover:scale-105"
										>
											<div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
												{course.imageUrl ? (
													<Image
														src={course.imageUrl}
														alt={course.courseName}
														width={400}
														height={192}
														className="w-full h-full object-cover"
													/>
												) : (
													<BookOpen className="h-16 w-16 text-white" />
												)}
											</div>
											<div className="p-6">
												<h3 className="text-xl font-semibold text-white mb-2">
													{course.courseName}
												</h3>
												<p className="text-gray-300 mb-4 line-clamp-2">{course.description}</p>

												<div className="flex items-center justify-between text-sm text-gray-400 mb-4">
													<div className="flex items-center space-x-1">
														<span className="px-2 py-1 bg-blue-600/20 rounded text-blue-300 text-xs">
															{course.difficulty}
														</span>
													</div>
													<div className="flex items-center space-x-1">
														<span className="px-2 py-1 bg-purple-600/20 rounded text-purple-300 text-xs">
															{course.category.replace(/_/g, " ")}
														</span>
													</div>
													{course.isFeatured && (
														<div className="flex items-center space-x-1">
															<Sparkles className="h-4 w-4 text-yellow-500" />
															<span className="text-yellow-500 text-xs">Featured</span>
														</div>
													)}
												</div>

												<div className="flex items-center justify-between text-sm text-gray-400 mb-4">
													<div className="flex items-center space-x-1">
														<Clock className="h-4 w-4" />
														<span>{course.durationHours}</span>
													</div>
													<div className="flex items-center space-x-1">
														<Users className="h-4 w-4" />
														<span>{course._count?.enrollments}</span>
													</div>
													<div className="flex items-center space-x-1">
														<Star className="h-4 w-4 text-yellow-500" />
														<span>{course.ratingAverage}</span>
													</div>
												</div>

												<div className="flex items-center justify-end">
													<button
														onClick={() => handleEnrollClick(course)}
														className="px-6 py-2 text-white rounded-lg transition-colors cursor-pointer"
														style={{ background: "#EB8216" }}
														onMouseEnter={(e) => (e.currentTarget.style.background = "#d67214")}
														onMouseLeave={(e) => (e.currentTarget.style.background = "#EB8216")}
													>
														{Number(course.price) === 0 ? 'Enroll Free' : 'Enroll Now'}
													</button>
												</div>
											</div>
										</div>
									))
								) : (
									<div className="col-span-full text-center py-12">
										<BookOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
										<p className="text-gray-400 text-lg">No courses found matching your filters.</p>
										<button
											onClick={() => {
												setSearchTerm("");
												setSelectedCategory("all");
												setSelectedDifficulty("all");
											}}
											className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
										>
											Clear Filters
										</button>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
