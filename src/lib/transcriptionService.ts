
import { initMicrophoneStream, createAudioProcessor, stopMediaStream } from './audioUtils';
import { geminiWebSocketService, GeminiStreamOptions } from './geminiWebSocket';
import { MediaFrameData } from './types/geminiWebSocketTypes';

export class TranscriptionService {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: any = null;
  private isActive = false;
  private onTranscriptionCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private mediaFramesUpdateInterval: number | null = null;
  private currentFrames: MediaFrameData | null = null;
  
  /**
   * Set media frames for video input
   */
  public setMediaFrames(frames: MediaFrameData): void {
    this.currentFrames = frames;
    
    // Update frames in websocket service immediately
    if (this.isActive && frames) {
      geminiWebSocketService.setMediaFrames(frames);
    }
  }
  
  /**
   * Start the transcription service
   */
  public async start(
    options: GeminiStreamOptions,
    onTranscription: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.isActive) return;
    
    try {
      this.onTranscriptionCallback = onTranscription;
      this.onErrorCallback = onError;
      
      // Initialize WebSocket connection first
      geminiWebSocketService.init(options);
      
      // Initialize microphone stream
      const { stream, audioContext } = await initMicrophoneStream();
      this.stream = stream;
      this.audioContext = audioContext;
      
      console.log("Audio context sample rate:", audioContext.sampleRate);
      
      // Create audio processor
      this.audioProcessor = createAudioProcessor(audioContext);
      
      // Start listening to microphone
      await geminiWebSocketService.startListening(
        audioContext,
        this.audioProcessor,
        stream,
        this.handleTranscription.bind(this),
        this.handleError.bind(this)
      );
      
      // Start periodic frame updates
      this.startMediaFramesUpdates();
      
      this.isActive = true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.handleError(error instanceof Error ? error.message : String(error));
      // Cleanup on error
      this.stop();
    }
  }
  
  /**
   * Start sending media frames updates to the API
   */
  private startMediaFramesUpdates(): void {
    // If we already have frames, send them now
    if (this.currentFrames) {
      geminiWebSocketService.setMediaFrames(this.currentFrames);
    }
    
    // Setup interval to continuously update frames (every 200ms)
    this.mediaFramesUpdateInterval = window.setInterval(() => {
      if (this.currentFrames) {
        geminiWebSocketService.setMediaFrames(this.currentFrames);
      }
    }, 200);
  }
  
  /**
   * Stop the transcription service
   */
  public stop(): void {
    if (!this.isActive) return;
    
    try {
      // Stop frame updates
      if (this.mediaFramesUpdateInterval !== null) {
        window.clearInterval(this.mediaFramesUpdateInterval);
        this.mediaFramesUpdateInterval = null;
      }
      
      // Stop WebSocket listening
      geminiWebSocketService.stopListening();
      geminiWebSocketService.closeConnection();
      
      // Stop and clean up media stream
      if (this.stream) {
        stopMediaStream(this.stream);
        this.stream = null;
      }
      
      // Close audio context
      if (this.audioContext) {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close().catch(err => console.error("Error closing audio context:", err));
        }
        this.audioContext = null;
      }
      
      this.audioProcessor = null;
      this.currentFrames = null;
    } catch (error) {
      console.error('Error during transcription stop:', error);
    } finally {
      this.isActive = false;
    }
  }
  
  /**
   * Handle transcription text from Gemini
   */
  private handleTranscription(text: string): void {
    if (this.onTranscriptionCallback) {
      this.onTranscriptionCallback(text);
    }
  }
  
  /**
   * Handle errors during transcription
   */
  private handleError(error: string): void {
    console.error('Transcription error:', error);
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
}

// Export a singleton instance
export const transcriptionService = new TranscriptionService();
