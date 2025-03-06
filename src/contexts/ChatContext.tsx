
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateResponse as generateGeminiResponse } from '../lib/gemini';
import { generateResponse as generateTogetherResponse } from '../lib/together';
import { saveConversation, loadConversations } from '../lib/storage';
import { useAiSettings } from './AiSettingsContext';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

type ChatContextType = {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { apiProvider } = useAiSettings();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from local storage on mount
  useEffect(() => {
    const loadedConversations = loadConversations();
    setConversations(loadedConversations);
    
    // If we have conversations, set the most recent one as current
    if (loadedConversations.length > 0) {
      setCurrentConversation(loadedConversations[0]);
    } else {
      // Otherwise start with a new conversation
      startNewConversation();
    }
  }, []);

  // Save conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversation(conversations);
    }
  }, [conversations]);

  const startNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setCurrentConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);
  };

  const loadConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    if (currentConversation?.id === id) {
      if (conversations.length > 1) {
        // Find the next conversation to focus on
        const nextConversation = conversations.find(conv => conv.id !== id);
        setCurrentConversation(nextConversation || null);
      } else {
        startNewConversation();
      }
    }
  };

  const updateConversation = (updatedConversation: Conversation) => {
    setCurrentConversation(updatedConversation);
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      
      // Update conversation with user message
      const updatedMessages = [...currentConversation.messages, userMessage];
      const updatedConversation = {
        ...currentConversation,
        messages: updatedMessages,
        updatedAt: Date.now(),
        // Generate title from first message if this is the first user message
        title: updatedMessages.filter(m => m.role === 'user').length === 1 
          ? content.slice(0, 30) + (content.length > 30 ? '...' : '') 
          : currentConversation.title,
      };
      
      updateConversation(updatedConversation);
      
      // Generate assistant response based on selected provider
      const generateResponse = apiProvider === 'gemini' 
        ? generateGeminiResponse 
        : generateTogetherResponse;
        
      const assistantContent = await generateResponse(
        updatedMessages.map(m => ({ role: m.role, content: m.content }))
      );
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      };
      
      // Update conversation with assistant message
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages,
        updatedAt: Date.now(),
      };
      
      updateConversation(finalConversation);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        currentConversation,
        conversations,
        isLoading,
        error,
        sendMessage,
        startNewConversation,
        loadConversation,
        deleteConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
