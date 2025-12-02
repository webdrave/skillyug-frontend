// Export all streaming components

// Original components (Session-based streaming)
export { MentorStreamDashboard } from './MentorStreamDashboard';
export { StudentStreamViewer } from './StudentStreamViewer';
export { ActiveStreamsList } from './ActiveStreamsList';
export { SessionScheduler } from './SessionScheduler';
export { BrowserStreaming } from './BrowserStreaming';
export { EnhancedStreamViewer } from './EnhancedStreamViewer';

// NEW: Mentor Channel System (ONE-CHANNEL-PER-MENTOR architecture)
// These components implement permanent mentor channels for cost optimization
export { MentorStreamingStudio } from './MentorStreamingStudio';
export { StudentWatchPage } from './StudentWatchPage';
export { LiveClassesDashboard } from './LiveClassesDashboard';
