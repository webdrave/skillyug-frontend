/**
 * WebRTC to RTMPS Bridge Service
 * Converts browser MediaStream to RTMPS for AWS IVS
 */

export interface RTMPSConfig {
  ingestEndpoint: string;
  streamKey: string;
  playbackUrl: string;
}

export class WebRTCBridge {
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocket | null = null;
  private isStreaming = false;

  /**
   * Start streaming from MediaStream to RTMPS endpoint via WebSocket relay
   */
  async startStreaming(
    stream: MediaStream,
    config: RTMPSConfig,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      // Connect to WebSocket relay server that will forward to RTMPS
      const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/stream-relay`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Connected to streaming relay');
        
        // Send configuration
        this.websocket?.send(JSON.stringify({
          type: 'config',
          ingestEndpoint: config.ingestEndpoint,
          streamKey: config.streamKey,
        }));

        // Start capturing media
        this.startCapture(stream, onError);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(new Error('Failed to connect to streaming server'));
      };

      this.websocket.onclose = () => {
        console.log('Streaming connection closed');
        this.stopStreaming();
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      onError?.(error as Error);
    }
  }

  private startCapture(stream: MediaStream, onError?: (error: Error) => void) {
    try {
      // Use WebM format for better browser support
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000,  // 128 kbps
      };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.websocket?.readyState === WebSocket.OPEN) {
          // Send video chunk to relay server
          this.websocket.send(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        onError?.(new Error('Recording failed'));
      };

      // Capture in 1-second chunks for low latency
      this.mediaRecorder.start(1000);
      this.isStreaming = true;
      
      console.log('Media capture started');
    } catch (error) {
      console.error('Failed to start media capture:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Stop streaming
   */
  stopStreaming(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.websocket) {
      this.websocket.close();
    }

    this.isStreaming = false;
    this.mediaRecorder = null;
    this.websocket = null;
  }

  /**
   * Check if currently streaming
   */
  getIsStreaming(): boolean {
    return this.isStreaming;
  }
}

export const webrtcBridge = new WebRTCBridge();
