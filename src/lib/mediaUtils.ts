
/**
 * Utility functions for handling media (webcam, screen capture) processing
 */

/**
 * Media configuration for webcam streaming
 */
export const webcamConfig = {
  width: 640,
  height: 480,
  frameRate: 15,
};

/**
 * Media configuration for screen capture
 */
export const screenCaptureConfig = {
  width: 1280,
  height: 720,
  frameRate: 5, // Lower frame rate for screen capture to reduce bandwidth
};

/**
 * Initializes webcam stream with optimal settings
 */
export const initWebcamStream = async (): Promise<MediaStream> => {
  try {
    const constraints = {
      video: {
        width: { ideal: webcamConfig.width },
        height: { ideal: webcamConfig.height },
        frameRate: { ideal: webcamConfig.frameRate },
        facingMode: 'user',
      },
      audio: false, // We handle audio separately
    };
    
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error("Error initializing webcam:", error);
    throw error;
  }
};

/**
 * Initializes screen capture stream with optimal settings
 */
export const initScreenCaptureStream = async (): Promise<MediaStream> => {
  try {
    const constraints = {
      video: {
        width: { ideal: screenCaptureConfig.width },
        height: { ideal: screenCaptureConfig.height },
        frameRate: { ideal: screenCaptureConfig.frameRate },
      },
      audio: false, // We handle audio separately
    };
    
    // @ts-ignore - TypeScript doesn't fully recognize getDisplayMedia options
    return await navigator.mediaDevices.getDisplayMedia(constraints);
  } catch (error) {
    console.error("Error initializing screen capture:", error);
    throw error;
  }
};

/**
 * Converts MediaStream to Blob for sending to API
 */
export const streamToBlob = async (stream: MediaStream): Promise<Blob> => {
  const track = stream.getVideoTracks()[0];
  if (!track) {
    throw new Error("No video track found in stream");
  }
  
  // Create ImageCapture from track
  // @ts-ignore - ImageCapture may not be recognized in TypeScript
  const imageCapture = new ImageCapture(track);
  
  // Capture a frame from the stream
  const bitmap = await imageCapture.grabFrame();
  
  // Convert to blob using canvas
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  ctx.drawImage(bitmap, 0, 0);
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob"));
      }
    }, 'image/jpeg', 0.8); // Use JPEG for better compression
  });
};

/**
 * Converts a Blob to base64 string for API transmission
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Process video frame from MediaStream for API transmission
 */
export const processVideoFrame = async (stream: MediaStream): Promise<string | null> => {
  try {
    const blob = await streamToBlob(stream);
    return await blobToBase64(blob);
  } catch (error) {
    console.error("Error processing video frame:", error);
    return null;
  }
};

/**
 * Stop all tracks in media streams
 */
export const stopMediaStreams = (...streams: (MediaStream | null)[]) => {
  streams.forEach(stream => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  });
};
