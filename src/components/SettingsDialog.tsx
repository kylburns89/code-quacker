
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAiSettings } from '../contexts/AiSettingsContext';
import { Bot, ArrowRight } from 'lucide-react';

const SettingsDialog: React.FC = () => {
  const {
    apiProvider,
    setApiProvider,
    geminiApiKey,
    setGeminiApiKey,
    geminiModelName,
    setGeminiModelName,
    togetherApiKey,
    setTogetherApiKey,
    togetherModelName,
    setTogetherModelName,
    isSettingsDialogOpen,
    hideSettingsDialog
  } = useAiSettings();

  const [localGeminiApiKey, setLocalGeminiApiKey] = useState('');
  const [localGeminiModelName, setLocalGeminiModelName] = useState('');
  const [localTogetherApiKey, setLocalTogetherApiKey] = useState('');
  const [localTogetherModelName, setLocalTogetherModelName] = useState('');
  const [activeTab, setActiveTab] = useState(apiProvider);

  useEffect(() => {
    setLocalGeminiApiKey(geminiApiKey);
    setLocalGeminiModelName(geminiModelName);
    setLocalTogetherApiKey(togetherApiKey);
    setLocalTogetherModelName(togetherModelName);
    setActiveTab(apiProvider);
  }, [isSettingsDialogOpen, geminiApiKey, geminiModelName, togetherApiKey, togetherModelName, apiProvider]);

  const handleSaveSettings = () => {
    if (activeTab === 'gemini') {
      setGeminiApiKey(localGeminiApiKey);
      setGeminiModelName(localGeminiModelName || 'gemini-2.0-flash-lite');
    } else {
      setTogetherApiKey(localTogetherApiKey);
      setTogetherModelName(localTogetherModelName || 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free');
    }
    
    setApiProvider(activeTab);
    hideSettingsDialog();
  };

  return (
    <Dialog open={isSettingsDialogOpen} onOpenChange={hideSettingsDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred AI model for the rubber duck assistant.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini">Google Gemini</TabsTrigger>
            <TabsTrigger value="together">Together.ai</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gemini" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                id="geminiApiKey"
                placeholder="Enter your Gemini API key"
                value={localGeminiApiKey}
                onChange={(e) => setLocalGeminiApiKey(e.target.value)}
                className="w-full"
                type="password"
              />
              <Input
                id="geminiModelName"
                placeholder="Model name (defaults to gemini-2.0-flash-lite)"
                value={localGeminiModelName}
                onChange={(e) => setLocalGeminiModelName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
                Invalid model names will default to gemini-2.0-flash-lite.
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={() => window.open('https://ai.google.dev/tutorials/setup', '_blank')} size="sm">
                  Get Gemini API Key <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="together" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                id="togetherApiKey"
                placeholder="Enter your Together.ai API key"
                value={localTogetherApiKey}
                onChange={(e) => setLocalTogetherApiKey(e.target.value)}
                className="w-full"
                type="password"
              />
              <Input
                id="togetherModelName"
                placeholder="Model name (defaults to DeepSeek-R1-Distill-Llama-70B-free)"
                value={localTogetherModelName}
                onChange={(e) => setLocalTogetherModelName(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally in your browser and never sent to our servers.
                Default model: deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
              </p>
              <div className="pt-2">
                <Button variant="outline" onClick={() => window.open('https://api.together.xyz/settings/api-keys', '_blank')} size="sm">
                  Get Together.ai API Key <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={hideSettingsDialog}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={(activeTab === 'gemini' && !localGeminiApiKey.trim()) || (activeTab === 'together' && !localTogetherApiKey.trim())}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
