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
  playbackUrl: string;
  sessionId: string;
  title: string;
  canJoin: boolean;
  message?: string;
}

export interface LiveClass {
  sessionId: string;
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  courseImage?: string;
  mentorName: string;
  mentorAvatar?: string;
  playbackUrl: string;
  startedAt: string;
  viewerCount: number;
  streamHealth?: string;
  enableChat: boolean;
  enableQuiz: boolean;
}

export interface LiveClassesResponse {
  success: boolean;
  count: number;
  classes: LiveClass[];
}

export interface ActiveClassResponse {
  success: boolean;
  isLive: boolean;
  message?: string;
  data?: {
    sessionId: string;
    title: string;
    description?: string;
    courseId?: string;
    courseName?: string;
    mentorName?: string;
    playbackUrl: string;
    startedAt: string;
    streamHealth?: string;
    viewerCount: number;
    enableChat: boolean;
    enableQuiz: boolean;
  };
}

export interface StreamStatusResponse {
  success: boolean;
  isLive: boolean;
  data?: {
    state: string;
    health?: string;
    viewerCount: number;
    startTime?: string;
  } | null;
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
   * Uses the IVS simple API endpoint
   */
  async joinSession(sessionId: string, authToken: string): Promise<{ data: JoinSessionResponse }> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/student/sessions/${sessionId}/join`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    // The IVS simple endpoint returns { playbackUrl, sessionId, title } directly
    return {
      data: {
        canJoin: !!response.data.playbackUrl,
        playbackUrl: response.data.playbackUrl,
        sessionId: response.data.sessionId,
        title: response.data.title,
        message: response.data.playbackUrl ? 'Session is live' : 'Session not started yet',
      }
    };
  }

  /**
   * Get all currently live classes/sessions
   * Called: Student dashboard showing all available live classes
   */
  async getLiveClasses(authToken: string): Promise<LiveClassesResponse> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/streaming/live-classes`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Get active session for a specific course/class
   * Called: When student opens a class page to check if it's live
   */
  async getActiveClassSession(courseId: string, authToken: string): Promise<ActiveClassResponse> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/streaming/active-class/${courseId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Check stream health/status by session ID
   * Called: Periodically by frontend to update UI (viewer count, health, etc.)
   */
  async getStreamStatus(sessionId: string, authToken: string): Promise<StreamStatusResponse> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/streaming/status/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }

  /**
   * Check stream status by channel ARN (for direct access)
   * Called: When you have the channel ARN and want to check status directly
   */
  async getStreamStatusByChannel(channelArn: string, authToken: string): Promise<StreamStatusResponse> {
    const encodedArn = encodeURIComponent(channelArn);
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/streaming/channel-status/${encodedArn}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  }
}

export const studentService = new StudentService();
