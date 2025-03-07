
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
  private retryCount = 0;
  private maxRetries = 2;
  
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
      this.retryCount = 0;
      
      console.log("Starting transcription service with options:", {
        model: options.model,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        messagesCount: options.messages?.length || 0
      });
      
      // Ensure we're using the correct model for voice input
      const model = options.model || '';
      if (!model.includes('multimodal-live')) {
        const originalModel = model;
        options.model = 'gemini-2.0-flash-multimodal-live';
        console.warn(`Changed model from ${originalModel} to ${options.model} for voice compatibility`);
      }
      
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
      
      // Let the caller know we started successfully
      console.log("Transcription service started successfully");
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
      console.log("Stopping transcription service");
      
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
    
    // Check if we should retry
    if (this.retryCount < this.maxRetries && 
        (error.includes("sample-rate") || error.includes("WebSocket connection error"))) {
      this.retryCount++;
      console.log(`Retrying transcription (attempt ${this.retryCount} of ${this.maxRetries})...`);
      
      // Stop and restart with a delay
      this.stop();
      
      // Wait a bit before retrying to allow resources to clean up
      setTimeout(() => {
        if (this.onTranscriptionCallback && this.onErrorCallback) {
          // We need to restart with the same callbacks
          const options: GeminiStreamOptions = {
            apiKey: 'reusing-previous-key', // This is just a placeholder, the service should still have the real key
            model: 'gemini-2.0-flash-multimodal-live'
          };
          this.start(options, this.onTranscriptionCallback, this.onErrorCallback)
            .catch(retryError => {
              console.error('Retry failed:', retryError);
              if (this.onErrorCallback) {
                this.onErrorCallback('Failed to restart transcription after error');
              }
            });
        }
      }, 1000);
    } else {
      // Pass the error to the callback
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }
}

// Export a singleton instance
export const transcriptionService = new TranscriptionService();
