
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { hasApiKey as hasGeminiApiKey, setApiKey as setGeminiApiKey, setModelName as setGeminiModelName, getModelName as getGeminiModelName } from '../lib/gemini';
import { hasApiKey as hasTogetherApiKey, setApiKey as setTogetherApiKey, setModelName as setTogetherModelName, getModelName as getTogetherModelName } from '../lib/together';

type ApiProvider = 'gemini' | 'together';

interface AiSettingsContextType {
  apiProvider: ApiProvider;
  setApiProvider: (provider: ApiProvider) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  geminiModelName: string;
  setGeminiModelName: (model: string) => void;
  togetherApiKey: string;
  setTogetherApiKey: (key: string) => void;
  togetherModelName: string;
  setTogetherModelName: (model: string) => void;
  isSettingsDialogOpen: boolean;
  showSettingsDialog: () => void;
  hideSettingsDialog: () => void;
}

const AiSettingsContext = createContext<AiSettingsContextType | undefined>(undefined);

export const AiSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [apiProvider, setApiProvider] = useState<ApiProvider>(() => {
    const storedProvider = localStorage.getItem('ai_provider');
    return (storedProvider as ApiProvider) || 'gemini';
  });
  
  const [geminiApiKey, setGeminiApiKeyState] = useState('');
  const [geminiModelName, setGeminiModelNameState] = useState(getGeminiModelName());
  
  const [togetherApiKey, setTogetherApiKeyState] = useState('');
  const [togetherModelName, setTogetherModelNameState] = useState(getTogetherModelName());
  
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  const updateGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    setGeminiApiKey(key);
  };

  const updateGeminiModelName = (model: string) => {
    setGeminiModelNameState(model);
    setGeminiModelName(model);
  };

  const updateTogetherApiKey = (key: string) => {
    setTogetherApiKeyState(key);
    setTogetherApiKey(key);
  };

  const updateTogetherModelName = (model: string) => {
    setTogetherModelNameState(model);
    setTogetherModelName(model);
  };

  const updateApiProvider = (provider: ApiProvider) => {
    setApiProvider(provider);
    localStorage.setItem('ai_provider', provider);
  };

  const showSettingsDialog = () => setIsSettingsDialogOpen(true);
  const hideSettingsDialog = () => setIsSettingsDialogOpen(false);

  return (
    <AiSettingsContext.Provider
      value={{
        apiProvider,
        setApiProvider: updateApiProvider,
        geminiApiKey,
        setGeminiApiKey: updateGeminiApiKey,
        geminiModelName,
        setGeminiModelName: updateGeminiModelName,
        togetherApiKey,
        setTogetherApiKey: updateTogetherApiKey,
        togetherModelName,
        setTogetherModelName: updateTogetherModelName,
        isSettingsDialogOpen,
        showSettingsDialog,
        hideSettingsDialog,
      }}
    >
      {children}
    </AiSettingsContext.Provider>
  );
};

export const useAiSettings = () => {
  const context = useContext(AiSettingsContext);
  if (context === undefined) {
    throw new Error('useAiSettings must be used within an AiSettingsProvider');
  }
  return context;
};
