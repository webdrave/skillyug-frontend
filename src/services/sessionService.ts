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
  ingestEndpoint: string;
  streamKey: string;
  playbackUrl: string;
  channelId: string;
}

export interface StreamingCredentials {
  ingestServer: string;
  streamKey: string;
  playbackUrl: string;
  channelId: string;
  sessionId: string;
  status: string;
  message: string;
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
    // Backend returns { success, data: { sessions, total, page, totalPages } }
    const data = response.data.data;
    return Array.isArray(data) ? data : (data?.sessions || []);
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

  /**
   * Start a session - This is the ONLY place where mentor gets ingest server + stream key
   * Backend assigns a free IVS channel and creates a new stream key
   */
  async startSession(sessionId: string): Promise<StartSessionResponse> {
    // Use the IVS simple API endpoint for secure channel pool flow
    const response = await axios.post(`${API_URL}/mentor/sessions/${sessionId}/start`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * End/Stop a session - Releases the IVS channel back to the pool
   */
  async endSession(sessionId: string): Promise<{ ok: boolean }> {
    const response = await axios.post(`${API_URL}/mentor/sessions/${sessionId}/stop`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data;
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

  /**
   * Student: Join a live session to get the playback URL
   */
  async joinSession(sessionId: string): Promise<{ playbackUrl: string; sessionId: string; title: string }> {
    const response = await axios.get(`${API_URL}/student/sessions/${sessionId}/join`, {
      headers: await getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get session for viewing (with access check)
   */
  async getSessionForViewing(sessionId: string): Promise<Session> {
    const response = await axios.get(`${API_URL}/sessions/${sessionId}/view`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  /**
   * Mentor: Get streaming credentials (ingest server + stream key) for a session
   * This assigns an available channel from the pool and generates a stream key
   * Use these credentials to configure OBS or other streaming software
   */
  async getStreamingCredentials(sessionId: string): Promise<StreamingCredentials> {
    const response = await axios.get(`${API_URL}/mentor/sessions/${sessionId}/credentials`, {
      headers: await getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Mentor: Release streaming credentials (releases channel back to pool)
   * Call this when cancelling or when done with the session
   */
  async releaseStreamingCredentials(sessionId: string): Promise<{ ok: boolean; message: string }> {
    const response = await axios.delete(`${API_URL}/mentor/sessions/${sessionId}/credentials`, {
      headers: await getAuthHeaders(),
    });
    return response.data;
  }
}

export const sessionService = new SessionService();
