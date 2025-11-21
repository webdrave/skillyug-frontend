import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Mentor Invitation Types
export interface MentorInvitation {
  email: string;
  token: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    fullName: string | null;
    email: string | null;
  };
}

export interface VerifyInviteResponse {
  success: boolean;
  data: {
    valid: boolean;
    email?: string;
    message: string;
  };
  message?: string;
}

export interface MentorSetupData {
  token: string;
  fullName: string;
  password: string;
  expertise: string[];
  experience?: number;
  linkedin?: string;
  twitter?: string;
  website?: string;
  tagline?: string;
  description?: string;
  bio?: string;
  image?: string;
}

export interface MentorProfile {
  id: string;
  userId: string;
  expertise: string[];
  experience: number;
  linkedin?: string;
  twitter?: string;
  website?: string;
  tagline?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    userType: string;
    createdAt: string;
  };
}

// Mentor Service
export const mentorService = {
  /**
   * Verify invitation token
   */
  verifyInvite: async (token: string): Promise<VerifyInviteResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mentor/auth/verify-invite`, {
        params: { token },
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Verify invite error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to verify invitation');
      }
      throw error;
    }
  },

  /**
   * Setup mentor profile
   */
  setupMentor: async (data: MentorSetupData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/mentor/setup`, data, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Setup mentor error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to setup mentor profile');
      }
      throw error;
    }
  },

  /**
   * Get mentor profile
   */
  getMentorProfile: async (userId: string, token?: string): Promise<MentorProfile> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${API_BASE_URL}/mentor/profile/${userId}`, {
        headers,
      });
      return response.data.data.mentorProfile;
    } catch (error) {
      console.error('Get mentor profile error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get mentor profile');
      }
      throw error;
    }
  },

  /**
   * Update mentor profile
   */
  updateMentorProfile: async (
    data: Partial<MentorSetupData>,
    token: string
  ): Promise<MentorProfile> => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/mentor/profile`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data.mentorProfile;
    } catch (error) {
      console.error('Update mentor profile error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update mentor profile');
      }
      throw error;
    }
  },

  /**
   * Get all mentors (public)
   */
  getMentors: async (params?: {
    page?: number;
    limit?: number;
    expertise?: string;
  }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mentor/mentors`, {
        params,
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Get mentors error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get mentors');
      }
      throw error;
    }
  },

  /**
   * Admin: Invite mentor
   */
  inviteMentor: async (email: string, token: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/mentor/admin/invite-mentor`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Invite mentor error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to invite mentor');
      }
      throw error;
    }
  },

  /**
   * Admin: Get all invitations
   */
  getInvitations: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      email?: string;
    }
  ) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mentor/admin/mentor-invitations`, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get invitations error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get invitations');
      }
      throw error;
    }
  },

  /**
   * Admin: Cancel invitation
   */
  cancelInvitation: async (invitationToken: string, authToken: string) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/mentor/admin/mentor-invitations/${invitationToken}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Cancel invitation error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to cancel invitation');
      }
      throw error;
    }
  },
};
