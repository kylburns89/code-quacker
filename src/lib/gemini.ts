// Integration with Google's Gemini API using the official client library
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";

type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

// This is a placeholder for the Gemini API key input
// In a production environment, this should be stored securely
let apiKey = '';
let genAI: GoogleGenerativeAI | null = null;
let chatModel: GenerativeModel | null = null;
let chatSession: ChatSession | null = null;
let modelName = 'gemini-2.0-flash-lite'; // Default model

// Enhanced rubber duck debugging system prompt
const RUBBER_DUCK_PROMPT = `You are an AI-powered rubber duck debugging assistant with expertise in software development.

When developers explain problems to you:
1. First, demonstrate that you understand their problem by briefly summarizing it
2. Ask targeted, thought-provoking questions that help them explore their own code and logic
3. Guide their thinking process without directly solving the problem for them
4. Suggest potential areas to investigate based on common issues related to their problem
5. If they share code, analyze it for potential bugs, edge cases, or logical errors
6. Recommend debugging techniques specific to their situation
7. Be conversational and encouraging, as if you're a senior developer mentoring them

Your goal is to help developers reach their own "aha!" moments through guided self-discovery.
Be concise, insightful, and focus on the developer's learning rather than just providing answers.`;

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('gemini_api_key', key);
  
  // Initialize the AI client when the key is set
  if (key) {
    genAI = new GoogleGenerativeAI(key);
    chatModel = genAI.getGenerativeModel({ model: getModelName() });
    // We'll create the chat session when needed
  }
};

export const setModelName = (name: string) => {
  if (name && name.trim()) {
    modelName = name.trim();
    localStorage.setItem('gemini_model_name', modelName);
    
    // Reinitialize the model with the new name if we have an API key
    if (genAI) {
      chatModel = genAI.getGenerativeModel({ model: modelName });
    }
  }
};

export const getModelName = (): string => {
  if (!modelName || modelName === '') {
    const storedModel = localStorage.getItem('gemini_model_name');
    if (storedModel) {
      modelName = storedModel;
    } else {
      modelName = 'gemini-2.0-flash-lite'; // Default model
    }
  }
  return modelName;
};

export const getApiKey = (): string => {
  if (!apiKey) {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      apiKey = storedKey;
      // Initialize the AI client if we have a stored key
      if (!genAI) {
        genAI = new GoogleGenerativeAI(storedKey);
        chatModel = genAI.getGenerativeModel({ model: getModelName() });
      }
    }
  }
  return apiKey;
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

export const generateResponse = async (messages: Message[]): Promise<string> => {
  const key = getApiKey();
  
  if (!key) {
    throw new Error('Gemini API key is not set');
  }

  // Initialize if not already done
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
    chatModel = genAI.getGenerativeModel({ model: getModelName() });
  }

  try {
    // Format the conversation history for the Gemini API
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' instead of 'assistant'
      parts: [{ text: msg.content }],
    }));

    // If this is a new conversation, add the system prompt as the first user message
    if (messages.length === 0 || messages[0].content.indexOf("You are an AI rubber duck") === -1) {
      history.unshift({
        role: 'user',
        parts: [{ text: RUBBER_DUCK_PROMPT }]
      });
    }

    // Start a new chat session with the history
    chatSession = chatModel.startChat({
      history: history.slice(0, -1), // Exclude the last message, which we'll send separately
    });

    // Get the last message to send
    const lastMessage = messages[messages.length - 1];

    // Send the last message and get the response
    const result = await chatSession.sendMessage(lastMessage.content);
    const response = result.response;
    
    // Return the text content of the response
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

// For testing without API calls
export const generateMockResponse = async (messages: Message[]): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
  
  if (lastUserMessage.includes('hello') || lastUserMessage.includes('hi')) {
    return "Hello! I'm your rubber duck debugging assistant. What code problem are you working on today?";
  }
  
  if (lastUserMessage.includes('error')) {
    return "Hmm, that error is interesting. Have you checked if all your variables are properly defined? Sometimes scope issues can cause unexpected errors.";
  }
  
  return "Quack! I'm listening. Have you considered breaking down the problem into smaller parts? Sometimes that helps identify where things are going wrong.";
};
