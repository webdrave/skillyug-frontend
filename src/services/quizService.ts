import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface QuizCreateInput {
  sessionId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
  duration?: number;
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  duration: number;
  launchedAt: string | null;
  endsAt: string | null;
  sessionId: string;
}

export interface QuizResponse {
  id: string;
  answer: number;
  isCorrect: boolean;
  responseTime: number;
  points: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    image: string | null;
  };
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userImage: string | null;
  totalPoints: number;
  correctAnswers: number;
  totalQuizzes: number;
  averageResponseTime: number;
}

const getAuthHeaders = async () => {
  const session = await getSession();
  const token = (session?.user as any)?.accessToken;
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

class QuizService {
  async createQuiz(data: QuizCreateInput): Promise<Quiz> {
    const response = await axios.post(`${API_URL}/quizzes`, data, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async launchQuiz(quizId: string): Promise<Quiz> {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/launch`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async endQuiz(quizId: string): Promise<{ quiz: Quiz; results: any }> {
    const response = await axios.post(`${API_URL}/quizzes/${quizId}/end`, {}, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async getSessionQuizzes(sessionId: string): Promise<Quiz[]> {
    const response = await axios.get(`${API_URL}/quizzes/sessions/${sessionId}/quizzes`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async getQuizResults(quizId: string): Promise<{ quiz: Quiz; responses: QuizResponse[]; stats: any }> {
    const response = await axios.get(`${API_URL}/quizzes/${quizId}/results`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async getSessionLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
    const response = await axios.get(`${API_URL}/quizzes/sessions/${sessionId}/leaderboard`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async getMyPerformance(sessionId: string): Promise<any> {
    const response = await axios.get(`${API_URL}/quizzes/sessions/${sessionId}/my-performance`, {
      headers: await getAuthHeaders(),
    });
    return response.data.data;
  }

  async deleteQuiz(quizId: string): Promise<void> {
    await axios.delete(`${API_URL}/quizzes/${quizId}`, {
      headers: await getAuthHeaders(),
    });
  }
}

export const quizService = new QuizService();
