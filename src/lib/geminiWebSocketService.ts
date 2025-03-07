
import { GeminiStreamOptions, GeminiResponse } from './types/geminiWebSocketTypes';
import { GeminiConnection } from './geminiConnection';
import { GeminiAudioProcessor } from './geminiAudioProcessor';

export class GeminiWebSocketService {
  private connection: GeminiConnection;
  private audioProcessor: GeminiAudioProcessor;
  private options: GeminiStreamOptions = { apiKey: '' };
  private onTextCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  
  constructor() {
    this.connection = new GeminiConnection();
    this.audioProcessor = new GeminiAudioProcessor();
  }

  /**
   * Initialize the WebSocket connection to Gemini API
   */
  public init(options: GeminiStreamOptions): void {
    this.options = options;
    
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
    this.onTextCallback = onText;
    this.onErrorCallback = onError;
    
    // Start audio processing
    this.audioProcessor.start(
      audioContext,
      audioProcessor,
      stream,
      this.sendAudioChunks.bind(this)
    );
    
    // Send initial request to start the conversation
    this.sendInitialRequest();
  }

  /**
   * Stop listening and close connections
   */
  public stopListening(): void {
    // Stop audio processing
    this.audioProcessor.stop();
    
    // Send end message to API
    this.sendEndRequest();
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
          this.onTextCallback(part.text);
        }
      }
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleWSError(event: Event): void {
    if (this.onErrorCallback) {
      this.onErrorCallback('WebSocket connection error');
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleWSClose(event: CloseEvent): void {
    // No specific handling needed currently
  }

  /**
   * Send audio chunks to Gemini API
   */
  private sendAudioChunks(chunks: Int16Array[]): void {
    if (!this.connection.isOpen()) return;
    
    // Process each audio chunk
    chunks.forEach((int16Data: Int16Array) => {
      // Create request with audio data
      const request = {
        multi_modal_live_input: {
          session_id: this.connection.getSessionId(),
          audio: {
            values: Array.from(int16Data),
          },
        },
      };
      
      // Send audio data to Gemini
      this.connection.send(request);
    });
  }

  /**
   * Send the initial request to start the conversation
   */
  private sendInitialRequest(): void {
    if (!this.connection.isOpen()) return;
    
    const initialRequest = {
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
    
    this.connection.send(initialRequest);
  }

  /**
   * Send end request to Gemini API
   */
  private sendEndRequest(): void {
    if (!this.connection.isOpen()) return;
    
    const endRequest = {
      multi_modal_live_input: {
        session_id: this.connection.getSessionId(),
        end_session: true,
      },
    };
    
    this.connection.send(endRequest);
  }
}

// Create and export a singleton instance
export const geminiWebSocketService = new GeminiWebSocketService();
