
// Types for WebSocket communication with Gemini API

export enum MediaStreamType {
  WEBCAM = 'webcam',
  SCREEN = 'screen',
  NONE = 'none'
}

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
    finishReason?: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
  error?: {
    message: string;
    code?: number;
    status?: string;
    details?: any;
  };
};

export type MediaFrameData = {
  webcamFrame: string | null;
  screenFrame: string | null;
};

export type LiveRequest = {
  contents?: {
    role: string;
    parts: {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }[];
  }[];
  generation_config?: {
    temperature?: number;
    max_output_tokens?: number;
    top_p?: number;
    top_k?: number;
  };
  contents_stream_config?: {
    stream_content: boolean;
  };
  multi_modal_live_input?: {
    enable_multi_modal_live_input?: boolean;
    session_id?: string;
    webcam?: {
      data: string;
    };
    screenshot?: {
      data: string;
    };
    audio?: {
      values: number[];
    };
    end_session?: boolean;
  };
};

export type LiveApiState = {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  sessionId: string | null;
  error: Error | null;
  audioLevel: number;
};
