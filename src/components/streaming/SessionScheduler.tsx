'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { sessionService, SessionCreateInput } from '@/services/sessionService';
import { mentorService } from '@/services/mentorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, CheckCircle } from 'lucide-react';
import { getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

interface Course {
  id: string;
  courseName: string;
}

interface SessionSchedulerProps {
  onSuccess?: () => void;
  preSelectedCourseId?: string;
}

interface CreatedSession {
  id: string;
  title: string;
  streamKey?: string;
  ingestEndpoint?: string;
  playbackUrl?: string;
}

export function SessionScheduler({ onSuccess, preSelectedCourseId }: SessionSchedulerProps = {}) {
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams?.get('courseId') || preSelectedCourseId;

  const [formData, setFormData] = useState<SessionCreateInput>({
    title: '',
    description: '',
    courseId: courseIdFromUrl || '',
    scheduledAt: new Date().toISOString(),
    duration: 60,
    streamType: 'RTMPS',
    enableQuiz: true,
    enableAttendance: true,
    enableChat: true,
    enableRecording: false,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const session = await getSession();
      const token = (session?.user as any)?.accessToken;
      if (!token) {
        console.error('No auth token available');
        setCourses([]);
        return;
      }

      // Use the mentor's courses endpoint instead of all courses
      const response = await mentorService.getMyCourses(token);
      const coursesData = response.data.courses || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]); // Set empty array on error
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData({ ...formData, scheduledAt: date.toISOString() });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Clean the form data - remove courseId if it's "none"
      const submitData = {
        ...formData,
        courseId: formData.courseId === 'none' ? undefined : formData.courseId,
      };
      const response = await sessionService.createSession(submitData);
      setSuccess(true);
      
      // Store session details for OBS setup
      if (response?.data?.session) {
        setCreatedSession({
          id: response.data.session.id,
          title: response.data.session.title,
          streamKey: response.data.credentials?.streamKey,
          ingestEndpoint: response.data.credentials?.ingestEndpoint,
          playbackUrl: response.data.credentials?.playbackUrl,
        });
      }
      
      // Don't auto-redirect if we have OBS credentials to show
      // Call onSuccess callback if provided and no credentials
      if (onSuccess && !response?.data?.credentials?.streamKey) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to schedule session';
      
      // Provide helpful error messages
      if (errorMessage.includes('Mentor profile not found')) {
        setError('Your mentor profile is not set up yet. Please contact support or try logging out and back in.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Schedule New Session
          </CardTitle>
          <CardDescription>
            Create a new live streaming session for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && !createdSession && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Session scheduled successfully! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {success && createdSession && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <div className="space-y-4">
                  <p className="font-semibold">Session Created Successfully!</p>
                  <p className="text-sm">Session: {createdSession.title}</p>
                  
                  {createdSession.ingestEndpoint && createdSession.streamKey && (
                    <div className="mt-4 p-4 bg-white rounded-md border border-green-300 space-y-3">
                      <p className="font-semibold text-gray-900">OBS Studio Setup:</p>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Server (Ingest Endpoint):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={createdSession.ingestEndpoint}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded font-mono"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(createdSession.ingestEndpoint!, 'ingest')}
                          >
                            {copiedField === 'ingest' ? '✓ Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">
                          Stream Key:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={createdSession.streamKey}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded font-mono"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(createdSession.streamKey!, 'streamKey')}
                          >
                            {copiedField === 'streamKey' ? '✓ Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>

                      {createdSession.playbackUrl && (
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">
                            Playback URL (for testing):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={createdSession.playbackUrl}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded font-mono"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(createdSession.playbackUrl!, 'playback')}
                            >
                              {copiedField === 'playback' ? '✓ Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-900 font-medium mb-2">📝 OBS Setup Instructions:</p>
                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Open OBS Studio</li>
                          <li>Go to Settings → Stream</li>
                          <li>Service: Custom</li>
                          <li>Paste the Server URL above</li>
                          <li>Paste the Stream Key above</li>
                          <li>Click Apply and OK</li>
                          <li>Start streaming when ready!</li>
                        </ol>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => window.location.href = '/mentor/sessions'}
                          className="flex-1"
                        >
                          Go to Sessions Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to React Hooks"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will you cover in this session?"
                rows={3}
              />
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <Label htmlFor="course">Course (Optional)</Label>
              <Select value={formData.courseId} onValueChange={(value: string) => setFormData({ ...formData, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (General Session)</SelectItem>
                  {courses && courses.length > 0 ? (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.courseName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-courses" disabled>No courses assigned yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Only your assigned courses are shown
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date & Time *</Label>
                <DatePicker
                  selected={new Date(formData.scheduledAt)}
                  onChange={handleDateChange}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min={15}
                  max={240}
                  required
                />
              </div>
            </div>

            {/* Stream Type */}
            <div className="space-y-2">
              <Label>Stream Type *</Label>
              <Select value={formData.streamType} onValueChange={(value: any) => setFormData({ ...formData, streamType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RTMPS">RTMPS (OBS Studio)</SelectItem>
                  <SelectItem value="WEBRTC" disabled>WebRTC (Browser) - Coming Soon</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                RTMPS requires OBS Studio for streaming. WebRTC support coming soon.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Label>Session Features</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-normal">Enable Live Chat</Label>
                  <p className="text-xs text-gray-500">Allow students to chat during session</p>
                </div>
                <Switch
                  checked={formData.enableChat}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, enableChat: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-normal">Enable Quizzes</Label>
                  <p className="text-xs text-gray-500">Launch interactive quizzes during session</p>
                </div>
                <Switch
                  checked={formData.enableQuiz}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, enableQuiz: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-normal">Track Attendance</Label>
                  <p className="text-xs text-gray-500">Monitor student participation</p>
                </div>
                <Switch
                  checked={formData.enableAttendance}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, enableAttendance: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-normal">Record Session</Label>
                  <p className="text-xs text-gray-500">Save recording to S3 (if configured)</p>
                </div>
                <Switch
                  checked={formData.enableRecording}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, enableRecording: checked })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              <Video className="mr-2 h-4 w-4" />
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
