
import { GeminiStreamOptions, GeminiResponse, MediaFrameData, LiveRequest } from './types/geminiWebSocketTypes';
import { GeminiConnection } from './geminiConnection';
import { GeminiAudioProcessor } from './geminiAudioProcessor';

export class GeminiWebSocketService {
  private connection: GeminiConnection;
  private audioProcessor: GeminiAudioProcessor;
  private options: GeminiStreamOptions = { apiKey: '' };
  private onTextCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private frameCapturingInterval: number | null = null;
  private lastFramesData: MediaFrameData | null = null;
  private isActive = false;
  
  constructor() {
    this.connection = new GeminiConnection();
    this.audioProcessor = new GeminiAudioProcessor();
  }

  /**
   * Initialize the WebSocket connection to Gemini API
   */
  public init(options: GeminiStreamOptions): void {
    this.options = options;
    
    // Ensure we're using the correct model for multimodal live input
    if (!options.model?.includes('multimodal-live')) {
      console.warn('Using model that may not support multimodal live input:', options.model);
      console.info('Recommended model: gemini-2.0-flash-multimodal-live');
    }
    
    this.connection.init(
      options,
      this.handleWSMessage.bind(this),
      this.handleWSError.bind(this),
      this.handleWSClose.bind(this)
    );
  }

  /**
   * Start listening to microphone and streaming audio to Gemini
   */
  public async startListening(
    audioContext: AudioContext,
    audioProcessor: any,
    stream: MediaStream,
    onText: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.isActive) {
      console.log('WebSocket service is already active, stopping first');
      this.stopListening();
    }
    
    this.onTextCallback = onText;
    this.onErrorCallback = onError;
    this.isActive = true;
    
    console.log('Starting WebSocket listening with audio context sample rate:', audioContext.sampleRate);
    
    // Start audio processing
    this.audioProcessor.start(
      audioContext,
      audioProcessor,
      stream,
      this.sendAudioChunks.bind(this)
    );
    
    // Send initial request to start the conversation
    this.sendInitialRequest();
    console.log('Initial request sent, session ID:', this.connection.getSessionId());
  }

  /**
   * Set the current media frames to be sent with audio
   */
  public setMediaFrames(framesData: MediaFrameData): void {
    this.lastFramesData = framesData;
  }

  /**
   * Stop listening and close connections
   */
  public stopListening(): void {
    if (!this.isActive) return;
    
    console.log('Stopping WebSocket listening');
    
    // Stop audio processing
    this.audioProcessor.stop();
    
    // Clear frame capturing interval
    if (this.frameCapturingInterval !== null) {
      window.clearInterval(this.frameCapturingInterval);
      this.frameCapturingInterval = null;
    }
    
    // Send end message to API
    this.sendEndRequest();
    
    this.isActive = false;
  }

  /**
   * Close the WebSocket connection
   */
  public closeConnection(): void {
    this.stopListening();
    this.connection.close();
  }

  /**
   * Process incoming WebSocket messages
   */
  private handleWSMessage(response: GeminiResponse): void {
    // Check for error in response
    if (response.error) {
      console.error('Gemini API error:', response.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(response.error.message);
      }
      return;
    }
    
    // Process text response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part.text && this.onTextCallback) {
          console.log('Received text from Gemini:', part.text.substring(0, 50) + (part.text.length > 50 ? '...' : ''));
          this.onTextCallback(part.text);
        }
      }
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleWSError(event: Event): void {
    console.error('WebSocket error:', event);
    if (this.onErrorCallback) {
      this.onErrorCallback('WebSocket connection error');
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleWSClose(event: CloseEvent): void {
    console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
    this.isActive = false;
  }

  /**
   * Send audio chunks to Gemini API
   */
  private sendAudioChunks(chunks: Int16Array[]): void {
    if (!this.connection.isOpen() || !this.isActive) {
      console.warn('Cannot send audio chunks: connection not open or inactive');
      return;
    }
    
    // Process each audio chunk
    chunks.forEach((int16Data: Int16Array) => {
      if (int16Data.length === 0) {
        return; // Skip empty chunks
      }
      
      // Create request with audio data
      const request: LiveRequest = {
        multi_modal_live_input: {
          session_id: this.connection.getSessionId(),
          audio: {
            values: Array.from(int16Data),
          },
        },
      };
      
      // Add video frames if available
      if (this.lastFramesData) {
        if (this.lastFramesData.webcamFrame) {
          request.multi_modal_live_input.webcam = {
            data: this.lastFramesData.webcamFrame
          };
        }
        
        if (this.lastFramesData.screenFrame) {
          request.multi_modal_live_input.screenshot = {
            data: this.lastFramesData.screenFrame
          };
        }
      }
      
      // Send data to Gemini
      this.connection.send(request);
    });
  }

  /**
   * Send the initial request to start the conversation
   */
  private sendInitialRequest(): void {
    if (!this.connection.isOpen()) {
      console.error('Cannot send initial request: connection not open');
      return;
    }
    
    const initialRequest: LiveRequest = {
      contents: this.options.messages?.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })) || [],
      generation_config: {
        temperature: this.options.temperature || 0.7,
        max_output_tokens: this.options.maxOutputTokens || 800,
      },
      contents_stream_config: {
        stream_content: true,
      },
      multi_modal_live_input: {
        enable_multi_modal_live_input: true,
        session_id: this.connection.getSessionId(),
      }
    };
    
    console.log('Sending initial request with session ID:', this.connection.getSessionId());
    this.connection.send(initialRequest);
  }

  /**
   * Send end request to Gemini API
   */
  private sendEndRequest(): void {
    if (!this.connection.isOpen()) return;
    
    const endRequest: LiveRequest = {
      multi_modal_live_input: {
        session_id: this.connection.getSessionId(),
        end_session: true,
      },
    };
    
    console.log('Sending end request with session ID:', this.connection.getSessionId());
    this.connection.send(endRequest);
  }
}

// Create and export a singleton instance
export const geminiWebSocketService = new GeminiWebSocketService();
