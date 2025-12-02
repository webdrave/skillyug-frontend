/**
 * Mentor Channel Service (Frontend)
 * 
 * API client for the ONE-CHANNEL-PER-MENTOR streaming system.
 * Each mentor gets a permanent IVS channel that they reuse for all classes.
 * 
 * Usage:
 * - Mentor Dashboard: Get credentials, start/end classes
 * - Student Dashboard: Watch live classes, browse all live sessions
 */

import axios, { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ============================================
// TYPES
// ============================================

/**
 * Mentor's permanent streaming credentials
 * Used to configure OBS Studio
 */
export interface MentorChannelCredentials {
  channelArn: string;
  streamKey: string;
  streamUrl: string; // Full RTMPS URL for OBS (rtmps://xxx:443/app/)
  ingestEndpoint: string;
  playbackUrl: string;
}

/**
 * Class session when mentor goes live
 */
export interface ClassSession {
  sessionId: string;
  playbackUrl: string;
  startedAt: string;
  viewerCount: number;
  streamHealth?: string;
}

/**
 * Active class status for students
 */
export interface ActiveClassStatus {
  isLive: boolean;
  sessionId?: string;
  playbackUrl?: string;
  classTitle?: string;
  mentorName?: string;
  startedAt?: string;
  viewerCount?: number;
  streamHealth?: string;
}

/**
 * Live class in the dashboard
 */
export interface LiveClass {
  sessionId: string;
  classId: string;
  classTitle: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  playbackUrl: string;
  startedAt: string;
  viewerCount: number;
  streamHealth?: string;
}

/**
 * Stream status for polling
 */
export interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  streamHealth?: string;
  startTime?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get authentication token from NextAuth session
 */
const getAuthToken = async (): Promise<string | null> => {
  if (typeof window !== 'undefined') {
    const session = await getSession();
    return (session?.user as any)?.accessToken || null;
  }
  return null;
};

/**
 * Create authenticated axios instance
 */
const createAuthAxios = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

/**
 * Handle API errors consistently
 */
const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const message = 
      axiosError.response?.data?.message || 
      axiosError.response?.data?.error || 
      defaultMessage;
    console.error(`MentorChannelService Error: ${message}`, axiosError);
    throw new Error(message);
  } else {
    console.error(defaultMessage, error);
    throw new Error(defaultMessage);
  }
};

// ============================================
// MENTOR CHANNEL SERVICE CLASS
// ============================================

class MentorChannelServiceClass {
  /**
   * ====================================
   * MENTOR ENDPOINTS
   * ====================================
   */

  /**
   * Get or create mentor's permanent IVS channel credentials
   * 
   * Use Case: Mentor opens streaming dashboard and needs OBS credentials
   * 
   * @param mentorId - The mentor's user ID
   * @param mentorName - Optional display name for the channel
   * @returns Streaming credentials for OBS configuration
   */
  async getMentorChannel(mentorId: string, mentorName?: string): Promise<MentorChannelCredentials> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<{ data: MentorChannelCredentials }>('/streaming/get-mentor-channel', {
        mentorId,
        mentorName,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to get streaming credentials');
    }
  }

  /**
   * Start a live class session
   * 
   * Use Case: Mentor clicks "Go Live" button after starting OBS
   * Prerequisites: Mentor must be streaming via OBS first
   * 
   * @param classId - The course/class ID
   * @param mentorId - The mentor's user ID
   * @param className - Optional display name for the session
   * @returns Session details with playback URL
   */
  async startClass(classId: string, mentorId: string, className?: string): Promise<ClassSession> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<{ data: ClassSession }>('/streaming/start-class', {
        classId,
        mentorId,
        className,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to start class. Make sure OBS is streaming first.');
    }
  }

  /**
   * End a live class session
   * 
   * Use Case: Mentor clicks "End Class" button
   * 
   * @param sessionId - The session ID to end
   */
  async endClass(sessionId: string): Promise<{ success: boolean }> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<{ data: { success: boolean } }>('/streaming/end-class', {
        sessionId,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to end class');
    }
  }

  /**
   * Regenerate stream key (if compromised)
   * 
   * @param mentorId - The mentor's user ID
   * @returns New stream key
   */
  async regenerateStreamKey(mentorId: string): Promise<{ streamKey: string }> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<{ data: { streamKey: string } }>('/streaming/regenerate-key', {
        mentorId,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to regenerate stream key');
    }
  }

  /**
   * ====================================
   * STUDENT ENDPOINTS
   * ====================================
   */

  /**
   * Check if a specific class is currently live
   * 
   * Use Case: Student opens a class page and wants to join live session
   * 
   * @param classId - The course/class ID to check
   * @returns Live status and playback info if live
   */
  async getActiveClass(classId: string): Promise<ActiveClassStatus> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ data: ActiveClassStatus }>(`/streaming/active-class/${classId}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to check class status');
    }
  }

  /**
   * Get all currently live classes
   * 
   * Use Case: Student dashboard showing available live sessions
   * 
   * @returns List of all live classes with playback URLs
   */
  async getLiveClasses(): Promise<{ count: number; classes: LiveClass[] }> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ data: { count: number; classes: LiveClass[] } }>('/streaming/live-classes');
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to get live classes');
    }
  }

  /**
   * ====================================
   * UTILITY ENDPOINTS
   * ====================================
   */

  /**
   * Check stream health and viewer count
   * 
   * Use Case: Polling for live stream status updates
   * 
   * @param mentorId - The mentor's user ID
   * @returns Stream status information
   */
  async getStreamStatus(mentorId: string): Promise<StreamStatus> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ data: StreamStatus }>(`/streaming/stream-status/${mentorId}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to get stream status');
    }
  }
}

// Export singleton instance
export const mentorChannelService = new MentorChannelServiceClass();
