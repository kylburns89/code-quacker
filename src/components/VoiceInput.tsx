
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import { transcriptionService } from '../lib/transcriptionService';
import { toast } from 'sonner';
import { useAiSettings } from '../contexts/AiSettingsContext';
import { useChat } from '../contexts/ChatContext';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import MediaControls from './MediaControls';

interface VoiceInputProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTextReceived, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false); // Default to false for real-time mode
  const [audioLevel, setAudioLevel] = useState(0);
  const { apiProvider, geminiApiKey, geminiModelName } = useAiSettings();
  const { currentConversation } = useChat();
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const audioCheckIntervalRef = useRef<number | null>(null);
  
  // Check if voice input is available - we support any Gemini model now, but will override to multimodal-live
  const isVoiceAvailable = apiProvider === 'gemini';
  
  // Initialize speech synthesis if enabled
  useEffect(() => {
    if (voiceOutputEnabled) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance();
    }
    
    // Save voice output preference
    localStorage.setItem('voice_output_enabled', voiceOutputEnabled.toString());
    
    return () => {
      // Cancel any ongoing speech when component unmounts
      if (speechSynthesisRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceOutputEnabled]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
      
      // Clear any pending error timeouts
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
      
      // Clear audio check interval
      if (audioCheckIntervalRef.current) {
        window.clearInterval(audioCheckIntervalRef.current);
      }
    };
  }, [isListening]);

  // Setup listener for new assistant messages to speak them
  useEffect(() => {
    if (!voiceOutputEnabled || !currentConversation) return;
    
    const messages = currentConversation.messages;
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speakText(lastMessage.content);
      }
    }
  }, [currentConversation?.messages, voiceOutputEnabled]);

  const speakText = (text: string) => {
    if (!voiceOutputEnabled || !window.speechSynthesis || !speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Setup new utterance
    const utterance = speechSynthesisRef.current;
    utterance.text = text;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Use a neutral voice if available
    // Load voices before trying to set them
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // If voices aren't loaded yet, wait and try again
        window.setTimeout(loadVoices, 100);
        return;
      }
      
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || voice.name.includes('Samantha') || voice.name.includes('Karen')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    };
    
    loadVoices();
  };

  const toggleVoiceOutput = () => {
    const newState = !voiceOutputEnabled;
    setVoiceOutputEnabled(newState);
    localStorage.setItem('voice_output_enabled', newState.toString());
    
    if (!newState && window.speechSynthesis) {
      // Cancel any ongoing speech when disabling
      window.speechSynthesis.cancel();
    }
    
    toast.info(newState ? 'Voice output enabled' : 'Real-time streaming mode');
  };

  const startListening = async () => {
    if (isListening || disabled) return;
    
    // Check if voice input is available
    if (!isVoiceAvailable) {
      toast.error('Voice input requires Gemini API');
      return;
    }
    
    // Check for API key
    if (!geminiApiKey) {
      toast.error('Gemini API key is required for voice input');
      return;
    }
    
    setIsInitializing(true);
    
    try {
      // Clear any existing error timeouts
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      
      // Prepare conversation history for context
      const previousMessages = currentConversation?.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      })) || [];
      
      // Add system prompt if not already in history
      if (previousMessages.length === 0 || 
          previousMessages[0].content.indexOf("You are an AI rubber duck") === -1) {
        previousMessages.unshift({
          role: 'user',
          content: `You are an AI rubber duck debugging assistant. 
          When the developer explains a problem to you, respond with helpful, 
          thoughtful questions and guidance that will help them solve their own problem.
          Focus on being insightful rather than simply providing answers.
          Be concise and ask clarifying questions when needed.
          If the developer provides code, analyze it for potential issues.
          Respond conversationally as if you're an expert developer
          helping a colleague reason through their problem.`
        });
      }
      
      console.log("Starting voice transcription with model:", 'gemini-2.0-flash-multimodal-live');
      
      // Start transcription service
      await transcriptionService.start(
        {
          apiKey: geminiApiKey,
          model: 'gemini-2.0-flash-multimodal-live', // Always use the multimodal live model for voice
          temperature: 0.7,
          messages: previousMessages
        },
        handleTranscriptionReceived,
        handleTranscriptionError
      );
      
      setIsListening(true);
      toast.success('Voice input active - speak now');
      
      // Start checking audio level
      startAudioLevelChecks();
    } catch (error) {
      console.error('Failed to start voice input:', error);
      toast.error(`Failed to start voice input: ${error instanceof Error ? error.message : String(error)}`);
      setAudioLevel(0);
    } finally {
      setIsInitializing(false);
    }
  };

  const startAudioLevelChecks = () => {
    // Clear existing interval if any
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
    }
    
    // Start a new interval to check audio level
    audioCheckIntervalRef.current = window.setInterval(() => {
      if (isListening) {
        // Get the audio level from gemini audio processor (mocked here)
        const mockAudioLevel = Math.random() * 0.5; // Simulate audio level for demonstration
        setAudioLevel(mockAudioLevel);
      } else {
        setAudioLevel(0);
      }
    }, 100);
  };

  const stopListening = () => {
    if (!isListening) return;
    
    transcriptionService.stop();
    setIsListening(false);
    setAudioLevel(0);
    
    // Clear audio check interval
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
      audioCheckIntervalRef.current = null;
    }
    
    toast.info('Voice input stopped');
  };

  const handleTranscriptionReceived = (text: string) => {
    if (text.trim()) {
      console.log("Received transcription:", text);
      onTextReceived(text);
    }
  };

  const handleTranscriptionError = (error: string) => {
    console.error('Transcription error:', error);
    toast.error(`Voice input error: ${error}`);
    
    // Stop listening on error after a short delay to allow the error toast to be seen
    if (errorTimeoutRef.current) {
      window.clearTimeout(errorTimeoutRef.current);
    }
    
    errorTimeoutRef.current = window.setTimeout(() => {
      stopListening();
      errorTimeoutRef.current = null;
    }, 500);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Don't render anything if voice input is not available
  if (!isVoiceAvailable) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center space-x-2">
        <Switch
          id="voice-output"
          checked={voiceOutputEnabled}
          onCheckedChange={toggleVoiceOutput}
        />
        <Label htmlFor="voice-output" className="cursor-pointer">
          {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Label>
      </div>
      
      {isListening && (
        <div className="w-24 flex items-center gap-1">
          <Progress value={audioLevel * 100} className="h-2" />
        </div>
      )}
      
      <MediaControls disabled={disabled || !isListening} />
      
      <Button
        type="button"
        size="icon"
        variant={isListening ? "default" : "ghost"}
        className={`h-9 w-9 shrink-0 rounded-md ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
        onClick={toggleListening}
        disabled={disabled || isInitializing}
        title={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isInitializing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

export default VoiceInput;
