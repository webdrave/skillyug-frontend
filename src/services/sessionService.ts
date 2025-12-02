import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface SessionCreateInput {
  title: string;
  description?: string;
  courseId?: string;
  scheduledAt: string;
  duration?: number;
  streamType: 'RTMPS' | 'WEBRTC';
  enableQuiz?: boolean;
  enableAttendance?: boolean;
  enableChat?: boolean;
  enableRecording?: boolean;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  streamType: 'RTMPS' | 'WEBRTC';
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  stageArn: string | null;
  participantToken: string | null;
  startedAt: string | null;
  endedAt: string | null;
  mentorProfile: {
    id: string;
    user: {
      fullName: string;
      email: string;
      image: string | null;
    };
  };
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
  } | null;
  liveStream: {
    id: string;
    playbackUrl: string;
    streamKey: string;
  } | null;
}

export interface StartSessionResponse {
  session: Session;
  credentials: {
    streamKey?: string;
    ingestEndpoint?: string;
    playbackUrl?: string;
    participantToken?: string;
    stageArn?: string;
  };
}

const getAuthHeaders = async () => {
  const session = await getSession();
  const token = (session?.user as any)?.accessToken;
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

class SessionService {
  async createSession(data: SessionCreateInput): Promise<{ data: { session: Session; message: string; credentials?: { streamKey?: string; ingestEndpoint?: string; playbackUrl?: string } } }> {
    const response = await axios.post(`${API_URL}/sessions`, data, {
      headers: await getAuthHeaders(),
    });
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await axios.get(`${API_URL}/sessions/${sessionId}`);
    return response.data.data;
  }

  async getMySessions(status?: string): Promise<Session[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const response = await axios.get(`${API_URL}/sessions/mentor/my-sessions?${params}`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async getUpcomingSessions(courseId?: string): Promise<Session[]> {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    
    const response = await axios.get(`${API_URL}/sessions/upcoming?${params}`);
    return response.data.data;
  }

  async getLiveSessions(): Promise<Session[]> {
    const response = await axios.get(`${API_URL}/sessions/live`);
    return response.data.data;
  }

  async startSession(sessionId: string): Promise<StartSessionResponse> {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/start`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async endSession(sessionId: string): Promise<Session> {
    const response = await axios.post(`${API_URL}/sessions/${sessionId}/end`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async updateSession(sessionId: string, data: Partial<SessionCreateInput>): Promise<Session> {
    const response = await axios.patch(`${API_URL}/sessions/${sessionId}`, data, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async cancelSession(sessionId: string): Promise<Session> {
    const response = await axios.delete(`${API_URL}/sessions/${sessionId}/cancel`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }
}

export const sessionService = new SessionService();
