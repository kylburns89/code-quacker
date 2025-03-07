
import { audioConfig, convertFloat32ToInt16 } from './audioUtils';
import { Message } from '../contexts/ChatContext';

// Types for WebSocket communication
export type GeminiStreamOptions = {
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  messages?: { role: string; content: string }[];
};

type GeminiResponse = {
  candidates?: {
    content: {
      parts: {
        text?: string;
      }[];
    };
  }[];
  error?: {
    message: string;
  };
};

class GeminiWebSocketService {
  private webSocket: WebSocket | null = null;
  private audioProcessor: any = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private onTextCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private sessionId: string = '';
  private options: GeminiStreamOptions = { apiKey: '' };
  private intervalId: number | null = null;
  
  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 9);
  }

  /**
   * Initialize the WebSocket connection to Gemini API
   */
  public init(options: GeminiStreamOptions): void {
    this.options = options;
    
    // Create WebSocket connection to Gemini API
    const wsUrl = `wss://generativelanguage.googleapis.com/v1/models/${options.model || 'gemini-2.0-flash-multimodal-live'}:streamGenerateContent?key=${options.apiKey}`;
    this.webSocket = new WebSocket(wsUrl);
    
    // Setup WebSocket event handlers
    this.webSocket.onopen = this.handleWSOpen.bind(this);
    this.webSocket.onmessage = this.handleWSMessage.bind(this);
    this.webSocket.onerror = this.handleWSError.bind(this);
    this.webSocket.onclose = this.handleWSClose.bind(this);
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
    if (this.isListening) return;
    
    this.audioContext = audioContext;
    this.audioProcessor = audioProcessor;
    this.stream = stream;
    this.onTextCallback = onText;
    this.onErrorCallback = onError;
    this.isListening = true;
    
    // Connect microphone source to audio processor
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.audioProcessor.processor);
    this.audioProcessor.processor.connect(this.audioContext.destination);
    
    // Start periodic sending of audio chunks
    this.intervalId = window.setInterval(this.sendAudioChunks.bind(this), 100);
    
    // Send initial request to start the conversation
    this.sendInitialRequest();
  }

  /**
   * Stop listening and close connections
   */
  public stopListening(): void {
    if (!this.isListening) return;
    
    // Clear audio sending interval
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Disconnect audio nodes
    if (this.source && this.audioProcessor) {
      this.source.disconnect();
      this.audioProcessor.processor.disconnect();
    }
    
    // Reset state
    this.source = null;
    this.isListening = false;
    this.audioProcessor?.reset();
    
    // Send end message to API
    this.sendEndRequest();
  }

  /**
   * Close the WebSocket connection
   */
  public closeConnection(): void {
    this.stopListening();
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleWSOpen(): void {
    console.log('WebSocket connection established');
  }

  /**
   * Handle WebSocket messages (responses from Gemini)
   */
  private handleWSMessage(event: MessageEvent): void {
    try {
      const response: GeminiResponse = JSON.parse(event.data);
      
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
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
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
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.isListening = false;
    
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Send the initial request to start the conversation
   */
  private sendInitialRequest(): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return;
    
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
        session_id: this.sessionId,
      }
    };
    
    this.webSocket.send(JSON.stringify(initialRequest));
  }

  /**
   * Send audio chunks to Gemini API
   */
  private sendAudioChunks(): void {
    if (!this.webSocket || 
        this.webSocket.readyState !== WebSocket.OPEN || 
        !this.audioProcessor || 
        !this.audioProcessor.isStarted()) {
      return;
    }
    
    const chunks = this.audioProcessor.getAudioChunks();
    if (chunks.length === 0) return;
    
    // Process each audio chunk
    chunks.forEach((chunk: Float32Array) => {
      const int16Data = convertFloat32ToInt16(chunk);
      
      // Create request with audio data
      const request = {
        multi_modal_live_input: {
          session_id: this.sessionId,
          audio: {
            values: Array.from(int16Data),
          },
        },
      };
      
      // Send audio data to Gemini
      this.webSocket.send(JSON.stringify(request));
    });
  }

  /**
   * Send end request to Gemini API
   */
  private sendEndRequest(): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return;
    
    const endRequest = {
      multi_modal_live_input: {
        session_id: this.sessionId,
        end_session: true,
      },
    };
    
    this.webSocket.send(JSON.stringify(endRequest));
  }
}

// Create and export a singleton instance
export const geminiWebSocketService = new GeminiWebSocketService();
