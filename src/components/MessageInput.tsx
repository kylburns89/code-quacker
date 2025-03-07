import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SendHorizonal, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import VoiceInput from './VoiceInput';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

const EXAMPLE_PROMPTS = [
  "Why does my API call work in the browser but not in my React app?",
  "I'm getting 'cannot read property of undefined' when accessing nested object data.",
  "My useEffect hook is running twice and I don't understand why.",
  "I've got an infinite loop in my React component. How can I debug this?",
  "My CSS flexbox layout is breaking on mobile devices."
];

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Explain your coding problem..." 
}) => {
  const [message, setMessage] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showExamples, setShowExamples] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
    setShowExamples(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleVoiceInput = (text: string) => {
    setMessage(prev => prev + text);
  };

  return (
    <div className="relative">
      {showExamples && (
        <div className="absolute bottom-full mb-2 w-full p-2 bg-card/90 backdrop-blur-sm rounded-md shadow-lg border z-10 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">Example problems:</p>
          <div className="grid gap-2">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                className="text-left text-sm p-2 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative glass rounded-xl p-2 shadow-md border-t">
        <div className="flex items-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0 rounded-md"
            onClick={() => setShowExamples(!showExamples)}
            title="Show examples"
          >
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 max-h-32 rounded-md border-0 bg-transparent focus-visible:ring-0 resize-none"
            rows={1}
            disabled={isLoading}
          />
          
          <VoiceInput 
            onTextReceived={handleVoiceInput}
            disabled={isLoading}
          />
          
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-md ml-2"
            disabled={isLoading || !message.trim()}
          >
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
