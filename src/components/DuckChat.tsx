
import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../contexts/ChatContext';
import { hasApiKey, setApiKey } from '../lib/gemini';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bot, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

const DuckChat: React.FC = () => {
  const { currentConversation, sendMessage, isLoading, error } = useChat();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!hasApiKey());

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleSaveApiKey = () => {
    setApiKey(apiKeyInput);
    setShowApiKeyDialog(false);
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

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Set up Gemini API Key
            </DialogTitle>
            <DialogDescription>
              To use the rubber duck assistant, you need to provide a Google Gemini API key.
              You can get one for free at the Google AI Studio.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Input
                id="apiKey"
                placeholder="Enter your Gemini API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => window.open('https://ai.google.dev/tutorials/setup', '_blank')}>
                Get API Key
              </Button>
              <Button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
                Save Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuckChat;
