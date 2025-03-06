
import React, { useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../contexts/ChatContext';
import { AlertTriangle } from 'lucide-react';
import { useAiSettings } from '../contexts/AiSettingsContext';
import SettingsDialog from './SettingsDialog';

const DuckChat: React.FC = () => {
  const { currentConversation, sendMessage, isLoading, error } = useChat();
  const { hasCurrentProviderApiKey, showSettingsDialog } = useAiSettings();
  
  // Show settings dialog if no API key is set for the selected provider
  useEffect(() => {
    if (!hasCurrentProviderApiKey()) {
      showSettingsDialog();
    }
  }, [hasCurrentProviderApiKey, showSettingsDialog]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)]">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mb-4 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>{error}</span>
        </div>
      )}
      
      <MessageList 
        messages={currentConversation?.messages || []} 
        isLoading={isLoading} 
      />
      
      <div className="mt-4">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
        />
      </div>

      <SettingsDialog />
    </div>
  );
};

export default DuckChat;
