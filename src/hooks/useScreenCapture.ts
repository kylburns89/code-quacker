
import { useState, useEffect, useCallback } from 'react';
import { initScreenCaptureStream, stopMediaStreams } from '../lib/mediaUtils';

interface UseScreenCaptureOptions {
  enabled?: boolean;
}

export function useScreenCapture({ enabled = false }: UseScreenCaptureOptions = {}) {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const startScreenCapture = useCallback(async () => {
    if (screenStream) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await initScreenCaptureStream();
      
      // Add listener for when user stops screen sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
      });
      
      setScreenStream(stream);
    } catch (err) {
      console.error('Failed to start screen capture:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [screenStream]);
  
  const stopScreenCapture = useCallback(() => {
    if (screenStream) {
      stopMediaStreams(screenStream);
      setScreenStream(null);
    }
  }, [screenStream]);
  
  // Auto start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startScreenCapture();
    } else {
      stopScreenCapture();
    }
    
    // Cleanup on unmount
    return () => {
      if (screenStream) {
        stopMediaStreams(screenStream);
      }
    };
  }, [enabled, startScreenCapture, stopScreenCapture, screenStream]);
  
  return {
    screenStream,
    isLoading,
    error,
    startScreenCapture,
    stopScreenCapture,
    isScreenCaptureActive: !!screenStream
  };
}
