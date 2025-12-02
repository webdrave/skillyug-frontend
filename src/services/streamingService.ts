import axios, { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper to get auth token from NextAuth session
const getAuthToken = async () => {
  if (typeof window !== 'undefined') {
    const session = await getSession();
    return (session?.user as any)?.accessToken || null;
  }
  return null;
};

// Helper to create axios instance with auth
const createAuthAxios = async () => {
  const token = await getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};

// Types
export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  status: 'CREATED' | 'LIVE' | 'ENDED';
  isActive: boolean;
  channelArn: string;
  ingestEndpoint: string;
  playbackUrl: string;
  viewerCount: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  mentorProfile: {
    id: string;
    userId: string;
    user?: {
      fullName?: string;
      email: string;
      image?: string;
    };
  };
  course?: {
    id: string;
    courseName: string;
    imageUrl?: string;
  };
}

export interface CreateStreamData {
  courseId?: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  latencyMode?: 'NORMAL' | 'LOW';
}

export interface CreateStreamResponse {
  message: string;
  stream: LiveStream;
  streamKey: string; // Only returned once during creation
}

export interface StreamResponse {
  message: string;
  stream: LiveStream;
}

export interface StreamListResponse {
  streams: LiveStream[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActiveStreamsResponse {
  streams: LiveStream[];
  total: number;
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

export interface ActiveClassSessionResponse {
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

/**
 * Streaming Service - API calls for AWS IVS live streaming
 */
class StreamingService {
  /**
   * Create a new live stream
   * REMOVED: Mentors should schedule sessions instead. Channels are assigned by admin.
   */
  // async createStream(data: CreateStreamData): Promise<CreateStreamResponse> {
  //   try {
  //     const api = await createAuthAxios();
  //     const response = await api.post<CreateStreamResponse>('/streams', data);
  //     return response.data;
  //   } catch (error) {
  //     this.handleError(error, 'Failed to create stream');
  //     throw error;
  //   }
  // }

  /**
   * Start a stream (mentor begins broadcasting)
   */
  async startStream(streamId: string): Promise<StreamResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<StreamResponse>(`/streams/${streamId}/start`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to start stream');
      throw error;
    }
  }

  /**
   * End a stream
   */
  async endStream(streamId: string): Promise<StreamResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<StreamResponse>(`/streams/${streamId}/end`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to end stream');
      throw error;
    }
  }

  /**
   * Get stream details
   */
  async getStream(streamId: string): Promise<LiveStream> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ stream: LiveStream }>(`/streams/${streamId}`);
      return response.data.stream;
    } catch (error) {
      this.handleError(error, 'Failed to fetch stream details');
      throw error;
    }
  }

  /**
   * Join a stream as a viewer (student)
   */
  async joinStream(streamId: string): Promise<StreamResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<StreamResponse>(`/streams/${streamId}/join`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to join stream');
      throw error;
    }
  }

  /**
   * Leave a stream as a viewer
   */
  async leaveStream(streamId: string): Promise<StreamResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.post<StreamResponse>(`/streams/${streamId}/leave`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to leave stream');
      throw error;
    }
  }

  /**
   * Get mentor's streams (for mentor dashboard)
   */
  async getMentorStreams(params?: {
    status?: 'CREATED' | 'LIVE' | 'ENDED';
    page?: number;
    limit?: number;
  }): Promise<StreamListResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<StreamListResponse>('/streams/mentor/my-streams', { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch mentor streams');
      throw error;
    }
  }

  /**
   * Get all active/live streams (for student dashboard)
   */
  async getActiveStreams(): Promise<ActiveStreamsResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<ActiveStreamsResponse>('/streams/active');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch active streams');
      throw error;
    }
  }

  /**
   * Get streams for a specific course
   */
  async getCourseStreams(courseId: string): Promise<ActiveStreamsResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<ActiveStreamsResponse>(`/streams/course/${courseId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch course streams');
      throw error;
    }
  }

  /**
   * Check stream health/status by session ID
   * Called: Periodically by frontend to update UI (viewer count, health, etc.)
   */
  async getStreamStatus(sessionId: string): Promise<StreamStatusResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<StreamStatusResponse>(`/streaming/status/${sessionId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch stream status');
      throw error;
    }
  }

  /**
   * Check stream status by channel ARN (for direct access)
   */
  async getStreamStatusByChannel(channelArn: string): Promise<StreamStatusResponse> {
    try {
      const api = await createAuthAxios();
      const encodedArn = encodeURIComponent(channelArn);
      const response = await api.get<StreamStatusResponse>(`/streaming/channel-status/${encodedArn}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch stream status by channel');
      throw error;
    }
  }

  /**
   * Get all currently live classes/sessions
   * Called: Student dashboard showing all available live classes
   */
  async getLiveClasses(): Promise<LiveClassesResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<LiveClassesResponse>('/streaming/live-classes');
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch live classes');
      throw error;
    }
  }

  /**
   * Get active session for a specific course/class
   * Called: When student opens a class page to check if it's live
   */
  async getActiveClassSession(courseId: string): Promise<ActiveClassSessionResponse> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<ActiveClassSessionResponse>(`/streaming/active-class/${courseId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch active class session');
      throw error;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const message = axiosError.response?.data?.message || 
                     axiosError.response?.data?.error || 
                     defaultMessage;
      console.error(`Streaming Service Error: ${message}`, axiosError);
    } else {
      console.error(defaultMessage, error);
    }
  }
}

export const streamingService = new StreamingService();

// Re-export the new mentor channel service for easy access
export { mentorChannelService } from './mentorChannelService';
export type { 
  MentorChannelCredentials, 
  ClassSession, 
  ActiveClassStatus, 
  LiveClass as MentorChannelLiveClass,
  StreamStatus 
} from './mentorChannelService';
