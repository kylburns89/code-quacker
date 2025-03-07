
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
      
      this.isActive = true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      this.handleError(error instanceof Error ? error.message : String(error));
      // Cleanup on error
      this.stop();
    }
  }
  
  /**
   * Stop the transcription service
   */
  public stop(): void {
    if (!this.isActive) return;
    
    try {
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
