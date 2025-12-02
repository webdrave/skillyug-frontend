/**
 * Type definitions for Amazon IVS Player SDK
 * 
 * The AWS IVS Player is loaded from CDN at runtime.
 * These types provide TypeScript support for the player API.
 * 
 * CDN URL: https://player.live-video.net/1.27.0/amazon-ivs-player.min.js
 */

declare global {
  interface Window {
    IVSPlayer?: IVSPlayerStatic;
  }
}

/**
 * Static IVS Player interface (accessed via window.IVSPlayer)
 */
export interface IVSPlayerStatic {
  /**
   * Creates a new IVS player instance
   */
  create(): IVSPlayer;

  /**
   * Checks if the IVS player is supported in the current browser
   */
  isPlayerSupported: boolean;

  /**
   * Player state constants
   */
  PlayerState: {
    /** Player is ready to play */
    READY: string;
    /** Player is actively playing content */
    PLAYING: string;
    /** Player is buffering content */
    BUFFERING: string;
    /** Player is idle (not playing) */
    IDLE: string;
    /** Playback has ended */
    ENDED: string;
  };

  /**
   * Player event type constants
   */
  PlayerEventType: {
    /** An error occurred */
    ERROR: string;
    /** Quality level changed */
    QUALITY_CHANGED: string;
    /** Player state changed */
    STATE_CHANGED: string;
    /** Text cue received (for captions) */
    TEXT_CUE: string;
    /** Metadata cue received */
    TEXT_METADATA_CUE: string;
    /** Duration changed */
    DURATION_CHANGED: string;
    /** Seekable range changed */
    SEEKABLE_RANGE_CHANGED: string;
    /** Audio track changed */
    AUDIO_BLOCKED: string;
    /** Buffer update */
    BUFFER_UPDATE: string;
  };

  /**
   * Player error types
   */
  ErrorType: {
    /** Network error */
    ERROR_NETWORK: string;
    /** Source error */
    ERROR_SOURCE: string;
    /** Not available error */
    ERROR_NOT_AVAILABLE: string;
    /** Unknown error */
    ERROR_UNKNOWN: string;
  };
}

/**
 * IVS Player instance interface
 */
export interface IVSPlayer {
  /**
   * Attaches the player to an HTML video element
   * @param videoElement The video element to attach to
   */
  attachHTMLVideoElement(videoElement: HTMLVideoElement): void;

  /**
   * Loads a stream by URL
   * @param url The HLS playback URL
   */
  load(url: string): void;

  /**
   * Starts playback
   */
  play(): Promise<void>;

  /**
   * Pauses playback
   */
  pause(): void;

  /**
   * Destroys the player instance and releases resources
   */
  delete(): void;

  /**
   * Adds an event listener
   * @param event The event type
   * @param callback The callback function
   */
  addEventListener(event: string, callback: (data?: IVSPlayerEvent) => void): void;

  /**
   * Removes an event listener
   * @param event The event type
   * @param callback The callback function
   */
  removeEventListener(event: string, callback: (data?: IVSPlayerEvent) => void): void;

  /**
   * Gets the current player state
   */
  getState(): string;

  /**
   * Gets whether the player is muted
   */
  isMuted(): boolean;

  /**
   * Sets the muted state
   * @param muted Whether to mute
   */
  setMuted(muted: boolean): void;

  /**
   * Gets the current volume (0.0 to 1.0)
   */
  getVolume(): number;

  /**
   * Sets the volume (0.0 to 1.0)
   * @param volume The volume level
   */
  setVolume(volume: number): void;

  /**
   * Gets available quality levels
   */
  getQualities(): IVSQuality[];

  /**
   * Gets the current quality level
   */
  getQuality(): IVSQuality;

  /**
   * Sets the quality level
   * @param quality The quality to set
   */
  setQuality(quality: IVSQuality, adaptive?: boolean): void;

  /**
   * Enables or disables auto quality selection
   * @param enabled Whether to enable auto quality
   */
  setAutoQualityMode(enabled: boolean): void;

  /**
   * Gets whether auto quality mode is enabled
   */
  isAutoQualityMode(): boolean;

  /**
   * Gets the current position in seconds
   */
  getPosition(): number;

  /**
   * Gets the duration in seconds
   */
  getDuration(): number;

  /**
   * Gets the buffered ranges
   */
  getBuffered(): TimeRanges;

  /**
   * Gets the seekable range
   */
  getSeekableRange(): { start: number; end: number };

  /**
   * Gets the live latency in seconds
   */
  getLiveLatency(): number;

  /**
   * Gets the version string
   */
  getVersion(): string;

  /**
   * Seeks to rebuffering for low latency streams
   */
  seekToLiveHead(): void;

  /**
   * Sets the playback rate (0.5 to 2.0)
   * @param rate The playback rate
   */
  setPlaybackRate(rate: number): void;

  /**
   * Gets the playback rate
   */
  getPlaybackRate(): number;

  /**
   * Sets whether to show native captions
   * @param enabled Whether to enable captions
   */
  setRebufferToLive(enabled: boolean): void;
}

/**
 * Quality level information
 */
export interface IVSQuality {
  /** Quality name (e.g., "720p") */
  name: string;
  /** Codec string */
  codecs: string;
  /** Bitrate in bps */
  bitrate: number;
  /** Frame rate */
  framerate: number;
  /** Video height */
  height: number;
  /** Video width */
  width: number;
}

/**
 * Player event data
 */
export interface IVSPlayerEvent {
  /** Event type */
  type: string;
  /** Error code (for error events) */
  code?: number;
  /** Error message */
  message?: string;
  /** Source error (for error events) */
  source?: string;
}

/**
 * Player error event
 */
export interface IVSPlayerError extends IVSPlayerEvent {
  type: string;
  code: number;
  message: string;
  source: string;
}

export {};
