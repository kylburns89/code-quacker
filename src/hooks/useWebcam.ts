
import { useState, useEffect, useCallback } from 'react';
import { initWebcamStream, stopMediaStreams } from '../lib/mediaUtils';

interface UseWebcamOptions {
  enabled?: boolean;
}

export function useWebcam({ enabled = false }: UseWebcamOptions = {}) {
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const startWebcam = useCallback(async () => {
    if (webcamStream) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await initWebcamStream();
      setWebcamStream(stream);
    } catch (err) {
      console.error('Failed to start webcam:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [webcamStream]);
  
  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      stopMediaStreams(webcamStream);
      setWebcamStream(null);
    }
  }, [webcamStream]);
  
  // Auto start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startWebcam();
    } else {
      stopWebcam();
    }
    
    // Cleanup on unmount
    return () => {
      if (webcamStream) {
        stopMediaStreams(webcamStream);
      }
    };
  }, [enabled, startWebcam, stopWebcam, webcamStream]);
  
  return {
    webcamStream,
    isLoading,
    error,
    startWebcam,
    stopWebcam,
    isWebcamActive: !!webcamStream
  };
}
