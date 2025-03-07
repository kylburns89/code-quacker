
import React from 'react';
import { Button } from './ui/button';
import { Camera, Monitor, Loader2, Ban } from 'lucide-react';
import { useWebcam } from '../hooks/useWebcam';
import { useScreenCapture } from '../hooks/useScreenCapture';
import { useMediaStreamMux } from '../hooks/useMediaStreamMux';
import { transcriptionService } from '../lib/transcriptionService';
import { toast } from 'sonner';

interface MediaControlsProps {
  disabled?: boolean;
}

const MediaControls: React.FC<MediaControlsProps> = ({ disabled = false }) => {
  const {
    webcamStream,
    isLoading: isWebcamLoading,
    error: webcamError,
    startWebcam,
    stopWebcam,
    isWebcamActive
  } = useWebcam();
  
  const {
    screenStream,
    isLoading: isScreenLoading,
    error: screenError,
    startScreenCapture,
    stopScreenCapture,
    isScreenCaptureActive
  } = useScreenCapture();
  
  const isProcessing = isWebcamLoading || isScreenLoading;
  
  // Use the media stream multiplexer to capture frames
  const { webcamFrame, screenFrame } = useMediaStreamMux({
    webcamStream,
    screenStream,
    enabled: isWebcamActive || isScreenCaptureActive,
    frameInterval: 300, // ~3 fps to reduce bandwidth
  });
  
  // Update frames in transcription service when they change
  React.useEffect(() => {
    transcriptionService.setMediaFrames({
      webcamFrame,
      screenFrame
    });
  }, [webcamFrame, screenFrame]);
  
  // Handle errors
  React.useEffect(() => {
    if (webcamError) {
      toast.error(`Webcam error: ${webcamError.message}`);
    }
    if (screenError) {
      toast.error(`Screen capture error: ${screenError.message}`);
    }
  }, [webcamError, screenError]);
  
  const toggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam();
      toast.info('Webcam disabled');
    } else {
      startWebcam();
      toast.success('Webcam enabled');
    }
  };
  
  const toggleScreenCapture = () => {
    if (isScreenCaptureActive) {
      stopScreenCapture();
      toast.info('Screen sharing disabled');
    } else {
      startScreenCapture();
      toast.success('Select a screen to share');
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={isWebcamActive ? "default" : "ghost"}
        className={`h-9 w-9 shrink-0 rounded-md ${isWebcamActive ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
        onClick={toggleWebcam}
        disabled={disabled || isProcessing}
        title={isWebcamActive ? "Turn off webcam" : "Turn on webcam"}
      >
        {isWebcamLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isWebcamActive ? (
          <Camera className="h-5 w-5" />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
      
      <Button
        type="button"
        size="icon"
        variant={isScreenCaptureActive ? "default" : "ghost"}
        className={`h-9 w-9 shrink-0 rounded-md ${isScreenCaptureActive ? 'bg-green-500 hover:bg-green-600' : ''}`}
        onClick={toggleScreenCapture}
        disabled={disabled || isProcessing}
        title={isScreenCaptureActive ? "Stop screen sharing" : "Share your screen"}
      >
        {isScreenLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isScreenCaptureActive ? (
          <Monitor className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export default MediaControls;
