
import { convertFloat32ToInt16 } from './audioUtils';

export class GeminiAudioProcessor {
  private audioProcessor: any = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private intervalId: number | null = null;
  private sendAudioCallback: ((chunks: Int16Array[]) => void) | null = null;
  
  /**
   * Start audio processing
   */
  public start(
    audioContext: AudioContext,
    audioProcessor: any,
    stream: MediaStream,
    sendAudio: (chunks: Int16Array[]) => void
  ): void {
    if (this.isListening) return;
    
    this.audioContext = audioContext;
    this.audioProcessor = audioProcessor;
    this.stream = stream;
    this.sendAudioCallback = sendAudio;
    this.isListening = true;
    
    // Connect microphone source to audio processor
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.audioProcessor.processor);
    this.audioProcessor.processor.connect(this.audioContext.destination);
    
    // Start periodic sending of audio chunks
    this.intervalId = window.setInterval(this.processAudioChunks.bind(this), 100);
  }
  
  /**
   * Stop audio processing
   */
  public stop(): void {
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
  }
  
  /**
   * Process audio chunks and send them
   */
  private processAudioChunks(): void {
    if (!this.audioProcessor || !this.audioProcessor.isStarted() || !this.sendAudioCallback) {
      return;
    }
    
    const chunks = this.audioProcessor.getAudioChunks();
    if (chunks.length === 0) return;
    
    // Process each audio chunk
    const processedChunks: Int16Array[] = chunks.map((chunk: Float32Array) => {
      return convertFloat32ToInt16(chunk);
    });
    
    // Send processed chunks
    this.sendAudioCallback(processedChunks);
  }
}
