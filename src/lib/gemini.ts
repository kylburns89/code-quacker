
// Integration with Google's Gemini API

type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

// This is a placeholder for the Gemini API key input
// In a production environment, this should be stored securely
let apiKey = '';

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('gemini_api_key', key);
};

export const getApiKey = (): string => {
  if (!apiKey) {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      apiKey = storedKey;
    }
  }
  return apiKey;
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const generateResponse = async (messages: Message[]): Promise<string> => {
  const key = getApiKey();
  
  if (!key) {
    throw new Error('Gemini API key is not set');
  }

  // Create the contents array in the format expected by Gemini API
  const formattedContents = [];
  
  // Add system prompt as the first user message if there are no messages yet
  if (messages.length === 0 || messages[0].role !== 'user') {
    formattedContents.push({
      role: 'user',
      parts: [{
        text: `You are an AI rubber duck debugging assistant. 
        When the developer explains a problem to you, respond with helpful, 
        thoughtful questions and guidance that will help them solve their own problem.
        Focus on being insightful rather than simply providing answers.
        Be concise and ask clarifying questions when needed.
        If the developer provides code, analyze it for potential issues.
        Respond conversationally as if you're an expert developer
        helping a colleague reason through their problem.`
      }]
    });
  }

  // Format user and assistant messages for Gemini API
  messages.forEach(msg => {
    formattedContents.push({
      role: msg.role,
      parts: [{ text: msg.content }]
    });
  });

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
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
