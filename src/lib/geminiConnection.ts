
import { GeminiResponse, GeminiStreamOptions } from './types/geminiWebSocketTypes';

export class GeminiConnection {
  private webSocket: WebSocket | null = null;
  private sessionId: string;
  private onMessageCallback: ((response: GeminiResponse) => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;
  private onCloseCallback: ((event: CloseEvent) => void) | null = null;
  
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
    // Create WebSocket connection to Gemini API using v1alpha endpoint
    const wsUrl = `wss://generativelanguage.googleapis.com/v1alpha/models/${options.model || 'gemini-2.0-flash-multimodal-live'}:streamGenerateContent?key=${options.apiKey}`;
    this.webSocket = new WebSocket(wsUrl);
    
    // Store callbacks
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.onCloseCallback = onClose;
    
    // Setup WebSocket event handlers
    this.webSocket.onopen = this.handleWSOpen.bind(this);
    this.webSocket.onmessage = this.handleWSMessage.bind(this);
    this.webSocket.onerror = this.handleWSError.bind(this);
    this.webSocket.onclose = this.handleWSClose.bind(this);
  }

  /**
   * Send data through the WebSocket
   */
  public send(data: any): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return;
    this.webSocket.send(JSON.stringify(data));
  }

  /**
   * Close the WebSocket connection
   */
  public close(): void {
    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
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
  }

  /**
   * Handle WebSocket messages (responses from Gemini)
   */
  private handleWSMessage(event: MessageEvent): void {
    try {
      const response: GeminiResponse = JSON.parse(event.data);
      if (this.onMessageCallback) {
        this.onMessageCallback(response);
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
