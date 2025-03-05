
import React, { useEffect, useRef } from 'react';
import { Message } from '../contexts/ChatContext';
import CodeBlock from './CodeBlock';
import Duck from './Duck';
import { Bot } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

// Function to detect code blocks in message content
const formatMessageContent = (content: string) => {
  // Split on markdown code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    // Check if this part is a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract language and code
      const match = part.match(/```(\w+)?\n([\s\S]+)```/);
      if (match) {
        const language = match[1] || 'javascript';
        const code = match[2].trim();
        return <CodeBlock key={index} code={code} language={language} />;
      }
    }
    
    // For regular text, just return with newlines converted to <br>
    return (
      <p key={index} className="whitespace-pre-wrap mb-2">
        {part}
      </p>
    );
  });
};

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full space-y-6 text-center opacity-70">
          <Duck size="lg" animate={true} />
          <div>
            <h2 className="text-xl font-semibold mb-2">Welcome to your Rubber Duck!</h2>
            <p className="text-muted-foreground max-w-md">
              Explain your code problem to me, and I'll help you think through it.
              Sometimes just talking through the issue helps you find the solution!
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div 
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                flex max-w-[80%] md:max-w-[70%] chat-bubble
                ${message.role === 'user' 
                  ? 'bg-primary text-primary-foreground animate-slide-in-left rounded-2xl rounded-tr-sm'
                  : 'glass animate-slide-in-right rounded-2xl rounded-tl-sm'}
                p-4 shadow-md transition-all
              `}
            >
              <div className="flex-shrink-0 mr-4">
                {message.role === 'assistant' ? (
                  <Duck size="sm" animate={false} />
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm">
                  {formatMessageContent(message.content)}
                </div>
                <div className="text-xs opacity-70 text-right mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="glass animate-pulse rounded-2xl rounded-tl-sm p-4 shadow-md max-w-[80%] md:max-w-[70%]">
            <div className="flex items-center space-x-2">
              <Duck size="sm" animate={true} />
              <span className="text-muted-foreground">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
