
import { convertFloat32ToInt16 } from './audioUtils';

export class GeminiAudioProcessor {
  private audioProcessor: any = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isListening = false;
  private intervalId: number | null = null;
  private sendAudioCallback: ((chunks: Int16Array[]) => void) | null = null;
  private audioLevel = 0;
  
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
    
    try {
      this.audioContext = audioContext;
      this.audioProcessor = audioProcessor;
      this.stream = stream;
      this.sendAudioCallback = sendAudio;
      
      console.log("Starting audio processing with sample rate:", audioContext.sampleRate);
      
      // Ensure audio tracks are enabled and active
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio tracks found in stream");
      }
      
      console.log("Audio tracks:", audioTracks.length, "First track enabled:", audioTracks[0].enabled);
      
      // Connect microphone source to audio processor
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.audioProcessor.processor);
      
      // Set listening flag before starting interval
      this.isListening = true;
      
      // Start periodic sending of audio chunks
      this.intervalId = window.setInterval(this.processAudioChunks.bind(this), 100);
      
      console.log("Audio processor started successfully");
    } catch (error) {
      console.error("Error starting audio processor:", error);
      this.stop();
      throw error;
    }
  }
  
  /**
   * Stop audio processing
   */
  public stop(): void {
    if (!this.isListening) return;
    
    try {
      console.log("Stopping audio processor");
      
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
    } catch (error) {
      console.error("Error stopping audio processor:", error);
    } finally {
      // Reset state
      this.source = null;
      this.isListening = false;
      if (this.audioProcessor) {
        this.audioProcessor.reset();
      }
      console.log("Audio processor stopped");
    }
  }
  
  /**
   * Process audio chunks and send them
   */
  private processAudioChunks(): void {
    if (!this.audioProcessor || !this.audioProcessor.isStarted() || !this.sendAudioCallback) {
      return;
    }
    
    try {
      const chunks = this.audioProcessor.getAudioChunks();
      if (chunks.length === 0) return;
      
      // Process each audio chunk and calculate audio level
      const processedChunks: Int16Array[] = chunks.map((chunk: Float32Array) => {
        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < chunk.length; i++) {
          sum += Math.abs(chunk[i]);
        }
        this.audioLevel = sum / chunk.length;
        
        // Log audio level for debugging
        if (Math.random() < 0.05) { // Only log 5% of the time to avoid spam
          console.log(`Audio level: ${this.audioLevel.toFixed(4)}`);
        }
        
        return convertFloat32ToInt16(chunk);
      });
      
      // Only send processed chunks if there's actual audio
      if (processedChunks.length > 0 && this.audioLevel > 0.001) {
        // Send processed chunks
        this.sendAudioCallback(processedChunks);
      }
    } catch (error) {
      console.error("Error processing audio chunks:", error);
    }
  }
  
  /**
   * Get current audio level (0.0 to 1.0)
   */
  public getAudioLevel(): number {
    return this.audioLevel;
  }
}
