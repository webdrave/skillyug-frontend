import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface StudentSession {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  courseName: string;
  courseImage?: string;
  scheduledAt: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  mentorName?: string;
  mentorImage?: string;
  playbackUrl?: string | null;
  attendanceCount: number;
  enableQuiz: boolean;
  enableChat: boolean;
  enableAttendance: boolean;
}

export interface JoinSessionResponse {
  session: {
    id: string;
    title: string;
    description?: string;
    courseId?: string;
    courseName: string;
    courseImage?: string;
    scheduledAt: string;
    duration: number;
    status: string;
    mentorName?: string;
    mentorImage?: string;
    enableQuiz: boolean;
    enableChat: boolean;
    enableAttendance: boolean;
  };
  playbackUrl: string;
  canJoin: boolean;
  message?: string;
}

class StudentService {
  /**
   * Get all sessions for enrolled courses
   */
  async getMySessions(authToken: string): Promise<{ data: { sessions: StudentSession[]; count: number } }> {
    const response = await axios.get(`${API_BASE_URL}/student/sessions`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Join a live session (get playback URL)
   */
  async joinSession(sessionId: string, authToken: string): Promise<{ data: JoinSessionResponse }> {
    const response = await axios.get(`${API_BASE_URL}/student/session/${sessionId}/join`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }
}

export const studentService = new StudentService();
