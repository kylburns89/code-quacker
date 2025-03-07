
import { useState, useEffect, useCallback, useRef } from 'react';
import { processVideoFrame } from '../lib/mediaUtils';

interface UseMediaStreamMuxOptions {
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  enabled: boolean;
  frameInterval?: number; // How often to capture frames in ms
}

export function useMediaStreamMux({
  webcamStream,
  screenStream,
  enabled,
  frameInterval = 200, // Default to 5 fps
}: UseMediaStreamMuxOptions) {
  const [webcamFrame, setWebcamFrame] = useState<string | null>(null);
  const [screenFrame, setScreenFrame] = useState<string | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const captureFrames = useCallback(async () => {
    try {
      // Process webcam frame if available
      if (webcamStream && webcamStream.active) {
        const webcamBase64 = await processVideoFrame(webcamStream);
        setWebcamFrame(webcamBase64);
      } else {
        setWebcamFrame(null);
      }
      
      // Process screen capture frame if available
      if (screenStream && screenStream.active) {
        const screenBase64 = await processVideoFrame(screenStream);
        setScreenFrame(screenBase64);
      } else {
        setScreenFrame(null);
      }
    } catch (error) {
      console.error('Error capturing frames:', error);
    }
  }, [webcamStream, screenStream]);
  
  // Start/stop frame capture based on enabled state
  useEffect(() => {
    const cleanup = () => {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
    
    if (enabled && (webcamStream || screenStream)) {
      // Capture initial frames
      captureFrames();
      
      // Setup interval for continuous capture
      frameIntervalRef.current = window.setInterval(captureFrames, frameInterval);
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [enabled, webcamStream, screenStream, frameInterval, captureFrames]);
  
  return {
    webcamFrame,
    screenFrame,
    hasActiveMedia: !!(webcamFrame || screenFrame)
  };
}
