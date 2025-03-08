
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAiSettings } from '../contexts/AiSettingsContext';
import { Bot, ArrowRight, Check } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'gemini' | 'together'>(apiProvider);

  useEffect(() => {
    setLocalGeminiApiKey(geminiApiKey);
    setLocalGeminiModelName(geminiModelName);
    setLocalTogetherApiKey(togetherApiKey);
    setLocalTogetherModelName(togetherModelName);
    setActiveTab(apiProvider);
  }, [isSettingsDialogOpen, geminiApiKey, geminiModelName, togetherApiKey, togetherModelName, apiProvider]);

  const handleSaveSettings = () => {
    // Save both API keys regardless of which tab is active
    if (localGeminiApiKey !== geminiApiKey) {
      setGeminiApiKey(localGeminiApiKey);
    }
    
    if (localGeminiModelName !== geminiModelName) {
      setGeminiModelName(localGeminiModelName || 'gemini-2.0-flash-lite');
    }
    
    if (localTogetherApiKey !== togetherApiKey) {
      setTogetherApiKey(localTogetherApiKey);
    }
    
    if (localTogetherModelName !== togetherModelName) {
      setTogetherModelName(localTogetherModelName || 'deepseek-ai/DeepSeek-V3');
    }
    
    // Set the active provider
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
            Configure and switch between AI providers for your rubber duck assistant.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gemini' | 'together')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini" className="flex items-center gap-1">
              Google Gemini {apiProvider === 'gemini' && <Check className="h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="together" className="flex items-center gap-1">
              Together.ai {apiProvider === 'together' && <Check className="h-3 w-3" />}
            </TabsTrigger>
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
                Default model: deepseek-ai/DeepSeek-V3
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
          <Button onClick={handleSaveSettings}>
            Save & Use {activeTab === 'gemini' ? 'Google Gemini' : 'Together.ai'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
