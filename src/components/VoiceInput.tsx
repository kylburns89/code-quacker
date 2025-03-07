import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { transcriptionService } from '../lib/transcriptionService';
import { toast } from 'sonner';
import { useAiSettings } from '../contexts/AiSettingsContext';
import { useChat } from '../contexts/ChatContext';

interface VoiceInputProps {
  onTextReceived: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTextReceived, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { apiProvider, geminiApiKey, geminiModelName } = useAiSettings();
  const { currentConversation } = useChat();
  
  // Check if voice input is available based on model
  const isVoiceAvailable = apiProvider === 'gemini' && geminiModelName === 'gemini-2.0-flash-exp';
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening]);

  const startListening = async () => {
    if (isListening || disabled) return;
    
    // Check if using correct provider and model
    if (!isVoiceAvailable) {
      toast.error('Voice input requires Gemini API with gemini-2.0-flash-exp model');
      return;
    }
    
    // Check for API key
    if (!geminiApiKey) {
      toast.error('Gemini API key is required for voice input');
      return;
    }
    
    setIsInitializing(true);
    
    try {
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
      
      // Start transcription service
      await transcriptionService.start(
        {
          apiKey: geminiApiKey,
          model: 'gemini-2.0-flash-multimodal-live', // Use the multimodal live model for voice
          temperature: 0.7,
          messages: previousMessages
        },
        handleTranscriptionReceived,
        handleTranscriptionError
      );
      
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start voice input:', error);
      toast.error('Failed to start voice input');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopListening = () => {
    if (!isListening) return;
    
    transcriptionService.stop();
    setIsListening(false);
  };

  const handleTranscriptionReceived = (text: string) => {
    if (text.trim()) {
      onTextReceived(text);
    }
  };

  const handleTranscriptionError = (error: string) => {
    console.error('Transcription error:', error);
    toast.error(`Voice input error: ${error}`);
    stopListening();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Don't render the button if voice input is not available
  if (!isVoiceAvailable) {
    return null;
  }

  return (
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
  );
};

export default VoiceInput;
