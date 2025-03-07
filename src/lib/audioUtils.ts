
// Utility functions for handling audio processing

/**
 * Audio configuration for WebSocket streaming
 */
export const audioConfig = {
  sampleRate: 16000,
  channelCount: 1,
  bitsPerSample: 16,
};

/**
 * Creates an audio processor to convert audio data for streaming
 */
export const createAudioProcessor = (audioContext: AudioContext) => {
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  
  // Variables to store audio processing state
  let started = false;
  let startTime = 0;
  let audioQueue: Float32Array[] = [];
  
  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    
    // If this is the first audio chunk, mark the start time
    if (!started) {
      started = true;
      startTime = Date.now();
    }
    
    // Clone the input data and add to queue
    const inputCopy = new Float32Array(input.length);
    inputCopy.set(input);
    audioQueue.push(inputCopy);
  };
  
  return {
    processor,
    getAudioChunks: () => {
      const chunks = [...audioQueue];
      audioQueue = [];
      return chunks;
    },
    isStarted: () => started,
    getStartTime: () => startTime,
    reset: () => {
      started = false;
      startTime = 0;
      audioQueue = [];
    }
  };
};

/**
 * Converts float audio data to int16 format required by Gemini API
 */
export const convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    // Convert to int16 range (-32768 to 32767)
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
};

/**
 * Initializes audio stream from the user's microphone
 */
export const initMicrophoneStream = async (): Promise<{
  stream: MediaStream;
  audioContext: AudioContext;
}> => {
  try {
    // First, get the user's microphone stream with the desired settings
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    
    // Create the audio context with the correct sample rate
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: audioConfig.sampleRate,
    });
    
    return { stream, audioContext };
  } catch (error) {
    console.error("Error initializing microphone:", error);
    throw error;
  }
};

/**
 * Stops all tracks in a media stream
 */
export const stopMediaStream = (stream: MediaStream) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};
