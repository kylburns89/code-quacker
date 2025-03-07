
// Types for WebSocket communication with Gemini API
export type GeminiStreamOptions = {
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  messages?: { role: string; content: string }[];
};

export type GeminiResponse = {
  candidates?: {
    content: {
      parts: {
        text?: string;
      }[];
    };
  }[];
  error?: {
    message: string;
  };
};

export type MediaFrameData = {
  webcamFrame: string | null;
  screenFrame: string | null;
};

export enum MediaStreamType {
  WEBCAM = 'webcam',
  SCREEN = 'screen',
  NONE = 'none'
}
