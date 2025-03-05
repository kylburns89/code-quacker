
import { Conversation } from '../contexts/ChatContext';

const STORAGE_KEY = 'rubber_duck_conversations';

export const saveConversation = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations to localStorage:', error);
  }
};

export const loadConversations = (): Conversation[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading conversations from localStorage:', error);
  }
  return [];
};

export const clearConversations = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing conversations from localStorage:', error);
  }
};

export const exportConversations = (): string => {
  const conversations = loadConversations();
  return JSON.stringify(conversations, null, 2);
};

export const importConversations = (jsonData: string): boolean => {
  try {
    const conversations = JSON.parse(jsonData) as Conversation[];
    saveConversation(conversations);
    return true;
  } catch (error) {
    console.error('Error importing conversations:', error);
    return false;
  }
};
