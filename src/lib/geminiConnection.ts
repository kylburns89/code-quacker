
import { GeminiResponse, GeminiStreamOptions } from './types/geminiWebSocketTypes';

export class GeminiConnection {
  private webSocket: WebSocket | null = null;
  private sessionId: string;
  private onMessageCallback: ((response: GeminiResponse) => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;
  private onCloseCallback: ((event: CloseEvent) => void) | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  
  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 9);
  }

  /**
   * Initialize the WebSocket connection to Gemini API
   */
  public init(
    options: GeminiStreamOptions, 
    onMessage: (response: GeminiResponse) => void,
    onError: (error: Event) => void,
    onClose: (event: CloseEvent) => void
  ): void {
    this.connectionAttempts = 0;
    
    // Store callbacks
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.onCloseCallback = onClose;
    
    this.createWebSocketConnection(options);
  }

  /**
   * Create WebSocket connection with retry logic
   */
  private createWebSocketConnection(options: GeminiStreamOptions): void {
    try {
      this.connectionAttempts++;
      
      // Create WebSocket connection to Gemini API using v1alpha endpoint
      // Always use multimodal-live model for WebSocket connections
      const model = 'gemini-2.0-flash-multimodal-live';
      const wsUrl = `wss://generativelanguage.googleapis.com/v1alpha/models/${model}:streamGenerateContent?key=${options.apiKey}`;
      
      console.log(`Attempting WebSocket connection (attempt ${this.connectionAttempts}) to model: ${model}`);
      this.webSocket = new WebSocket(wsUrl);
      
      // Setup WebSocket event handlers
      this.webSocket.onopen = this.handleWSOpen.bind(this);
      this.webSocket.onmessage = this.handleWSMessage.bind(this);
      this.webSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.handleWSError(event);
        
        // Attempt to reconnect if within retry limits
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(`Retrying connection (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
          setTimeout(() => this.createWebSocketConnection(options), 1000);
        }
      };
      this.webSocket.onclose = this.handleWSClose.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(new Event('error'));
      }
    }
  }

  /**
   * Send data through the WebSocket
   */
  public send(data: any): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send data: WebSocket not open');
      return;
    }
    
    try {
      // Log only relevant parts to avoid large data dumps
      const dataCopy = { ...data };
      
      // Remove webcam/screenshot data for logging
      if (dataCopy.multi_modal_live_input) {
        if (dataCopy.multi_modal_live_input.webcam) {
          dataCopy.multi_modal_live_input.webcam = { data: '[WEBCAM_DATA]' };
        }
        if (dataCopy.multi_modal_live_input.screenshot) {
          dataCopy.multi_modal_live_input.screenshot = { data: '[SCREENSHOT_DATA]' };
        }
        if (dataCopy.multi_modal_live_input.audio) {
          dataCopy.multi_modal_live_input.audio = { values: '[AUDIO_DATA]' };
        }
      }
      
      console.log('Sending WebSocket data:', JSON.stringify(dataCopy).substring(0, 200) + '...');
      
      this.webSocket.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending WebSocket data:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(new Event('error'));
      }
    }
  }

  /**
   * Close the WebSocket connection
   */
  public close(): void {
    if (this.webSocket) {
      try {
        this.webSocket.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      } finally {
        this.webSocket = null;
      }
    }
  }
  
  /**
   * Get session ID for this connection
   */
  public getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Check if WebSocket is open
   */
  public isOpen(): boolean {
    return this.webSocket !== null && this.webSocket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleWSOpen(): void {
    console.log('WebSocket connection established');
    // Reset connection attempts on successful connection
    this.connectionAttempts = 0;
  }

  /**
   * Handle WebSocket messages (responses from Gemini)
   */
  private handleWSMessage(event: MessageEvent): void {
    try {
      const response: GeminiResponse = JSON.parse(event.data);
      
      // Log non-empty response
      if (response.candidates && response.candidates.length > 0) {
        console.log('WebSocket received:', JSON.stringify(response).substring(0, 200) + '...');
      }
      
      if (this.onMessageCallback) {
        this.onMessageCallback(response);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleWSError(event: Event): void {
    console.error('WebSocket error:', event);
    if (this.onErrorCallback) {
      this.onErrorCallback(event);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleWSClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    if (this.onCloseCallback) {
      this.onCloseCallback(event);
    }
  }
}
