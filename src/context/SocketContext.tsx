'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  leaveSession: (sessionId: string) => void;
  sendChatMessage: (sessionId: string, message: string) => void;
  submitQuizAnswer: (quizId: string, answer: number, responseTime: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Get token from NextAuth session
    const token = (session?.user as any)?.accessToken;
    if (!token) {
      console.warn('No auth token found - Socket.IO connection skipped');
      return;
    }

    // Connect to Socket.IO server
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    socketInstance.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  const joinSession = useCallback((sessionId: string) => {
    if (socket) {
      socket.emit('session:join', { sessionId });
    }
  }, [socket]);

  const leaveSession = useCallback((sessionId: string) => {
    if (socket) {
      socket.emit('session:leave', { sessionId });
    }
  }, [socket]);

  const sendChatMessage = useCallback((sessionId: string, message: string) => {
    if (socket) {
      socket.emit('chat:send', { sessionId, message });
    }
  }, [socket]);

  const submitQuizAnswer = useCallback((quizId: string, answer: number, responseTime: number) => {
    if (socket) {
      socket.emit('quiz:answer', { quizId, answer, responseTime });
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinSession,
        leaveSession,
        sendChatMessage,
        submitQuizAnswer,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
