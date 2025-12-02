'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { Session } from '@/services/sessionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Users, Trophy, MessageCircle } from 'lucide-react';

interface EnhancedViewerProps {
  session: Session;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  userType: string;
  message: string;
  timestamp: string;
}

interface ActiveQuiz {
  id: string;
  question: string;
  options: string[];
  points: number;
  duration: number;
  launchedAt: string;
}

interface QuizResult {
  isCorrect: boolean;
  points: number;
  correctAnswer: number;
}

export function EnhancedStreamViewer({ session }: EnhancedViewerProps) {
  const { socket, isConnected, joinSession, leaveSession, sendChatMessage, submitQuizAnswer } = useSocket();
  
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  
  const [participantCount, setParticipantCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Initialize IVS Player
  useEffect(() => {
    if (!session.liveStream?.playbackUrl) return;

    const script = document.createElement('script');
    script.src = 'https://player.live-video.net/1.26.0/amazon-ivs-player.min.js';
    script.async = true;
    script.onload = () => {
      if (videoRef.current && (window as any).IVSPlayer) {
        const player = (window as any).IVSPlayer.create();
        player.attachHTMLVideoElement(videoRef.current.querySelector('video'));
        player.load(session.liveStream!.playbackUrl);
        player.play();
        playerRef.current = player;
      }
    };
    document.body.appendChild(script);

    return () => {
      if (playerRef.current) {
        playerRef.current.delete();
      }
      document.body.removeChild(script);
    };
  }, [session.liveStream]);

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join session
    joinSession(session.id);

    // Listen for events
    socket.on('session:joined', (data: any) => {
      setParticipantCount(data.participantCount);
    });

    socket.on('attendance:update', (data: any) => {
      setParticipantCount(data.participantCount);
    });

    socket.on('chat:message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('quiz:launched', (quiz: ActiveQuiz) => {
      setActiveQuiz(quiz);
      setSelectedAnswer(null);
      setQuizResult(null);
      setQuizStartTime(Date.now());
      setTimeLeft(quiz.duration);
    });

    socket.on('quiz:ended', () => {
      setActiveQuiz(null);
      setTimeLeft(0);
    });

    socket.on('quiz:answered', (result: QuizResult) => {
      setQuizResult(result);
    });

    return () => {
      leaveSession(session.id);
      socket.off('session:joined');
      socket.off('attendance:update');
      socket.off('chat:message');
      socket.off('quiz:launched');
      socket.off('quiz:ended');
      socket.off('quiz:answered');
    };
  }, [socket, isConnected, session.id, joinSession, leaveSession]);

  // Quiz timer
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendChatMessage(session.id, messageInput);
    setMessageInput('');
  };

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    const responseTime = Date.now() - quizStartTime;
    submitQuizAnswer(activeQuiz.id, selectedAnswer, responseTime);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div ref={videoRef} className="aspect-video bg-black">
                <video className="w-full h-full" controls />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{session.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {participantCount} watching
                  </Badge>
                  {isConnected && <Badge variant="default">Live</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{session.description}</p>
              <div className="mt-2 text-sm">
                <p><strong>Mentor:</strong> {session.mentorProfile.user.fullName}</p>
                {session.course && <p><strong>Course:</strong> {session.course.title}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Active Quiz */}
          {activeQuiz && (
            <Card className="border-blue-500 border-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Live Quiz
                  </CardTitle>
                  <Badge variant="destructive">
                    {timeLeft}s remaining
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{activeQuiz.question}</p>
                <div className="space-y-2">
                  {activeQuiz.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      disabled={!!quizResult}
                      className={`w-full p-3 text-left border rounded-lg transition ${
                        quizResult
                          ? index === quizResult.correctAnswer
                            ? 'bg-green-100 border-green-500'
                            : index === selectedAnswer
                            ? 'bg-red-100 border-red-500'
                            : 'bg-gray-50 border-gray-300'
                          : selectedAnswer === index
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-white border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {!quizResult && (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={selectedAnswer === null}
                    className="w-full"
                  >
                    Submit Answer ({activeQuiz.points} points)
                  </Button>
                )}
                {quizResult && (
                  <Alert className={quizResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}>
                    <AlertDescription>
                      {quizResult.isCorrect ? (
                        <span className="text-green-700">✅ Correct! +{quizResult.points} points</span>
                      ) : (
                        <span className="text-red-700">❌ Incorrect. No points awarded.</span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{msg.userName}</span>
                      {msg.userType === 'MENTOR' && (
                        <Badge variant="secondary" className="text-xs">Mentor</Badge>
                      )}
                    </div>
                    <p className="text-sm bg-gray-100 rounded p-2">{msg.message}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-500 text-sm">No messages yet</p>
                )}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={!isConnected}
                  />
                  <Button onClick={handleSendMessage} size="icon" disabled={!isConnected}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
