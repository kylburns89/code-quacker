
import { initMicrophoneStream, createAudioProcessor, stopMediaStream } from './audioUtils';
import { geminiWebSocketService, GeminiStreamOptions } from './geminiWebSocket';

export class TranscriptionService {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: any = null;
  private isActive = false;
  private onTranscriptionCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  
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
      
      // Initialize microphone stream
      const { stream, audioContext } = await initMicrophoneStream();
      this.stream = stream;
      this.audioContext = audioContext;
      
      // Create audio processor
      this.audioProcessor = createAudioProcessor(audioContext);
      
      // Initialize WebSocket connection
      geminiWebSocketService.init(options);
      
      // Start listening to microphone
      await geminiWebSocketService.startListening(
        audioContext,
        this.audioProcessor,
        stream,
        this.handleTranscription.bind(this),
        this.handleError.bind(this)
      );
      
      this.isActive = true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.handleError(error instanceof Error ? error.message : 'Failed to start transcription');
      // Cleanup on error
      this.stop();
    }
  }
  
  /**
   * Stop the transcription service
   */
  public stop(): void {
    if (!this.isActive) return;
    
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
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    
    this.audioProcessor = null;
    this.isActive = false;
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
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
}

// Export a singleton instance
export const transcriptionService = new TranscriptionService();
