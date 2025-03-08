
import OpenAI from 'openai';

// Store the API key and model name
let apiKey = '';
let modelName = 'deepseek-ai/DeepSeek-V3'; // Default model
let client: OpenAI | null = null;

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('together_api_key', key);
  
  // Initialize the OpenAI client when the key is set
  if (key) {
    client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.together.xyz/v1',
      dangerouslyAllowBrowser: true, // Allow running in browser environment
    });
  }
};

export const setModelName = (name: string) => {
  if (name && name.trim()) {
    modelName = name.trim();
    localStorage.setItem('together_model_name', modelName);
  }
};

export const getModelName = (): string => {
  if (!modelName || modelName === '') {
    const storedModel = localStorage.getItem('together_model_name');
    if (storedModel) {
      modelName = storedModel;
    } else {
      modelName = 'deepseek-ai/DeepSeek-V3';
    }
  }
  return modelName;
};

export const getApiKey = (): string => {
  if (!apiKey) {
    const storedKey = localStorage.getItem('together_api_key');
    if (storedKey) {
      apiKey = storedKey;
      // Initialize the client if we have a stored key
      if (!client) {
        client = new OpenAI({
          apiKey: storedKey,
          baseURL: 'https://api.together.xyz/v1',
          dangerouslyAllowBrowser: true, // Allow running in browser environment
        });
      }
    }
  }
  return apiKey;
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

type MessageRole = 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

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

export const generateResponse = async (messages: Message[]): Promise<string> => {
  const key = getApiKey();
  
  if (!key) {
    throw new Error('Together API key is not set');
  }

  // Initialize if not already done
  if (!client) {
    client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.together.xyz/v1',
      dangerouslyAllowBrowser: true, // Allow running in browser environment
    });
  }

  try {
    // Format the conversation history for the Together API
    // Create properly typed message objects for the OpenAI SDK
    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map(msg => {
      // Convert our simple role to OpenAI's expected role
      if (msg.role === 'user') {
        return {
          role: 'user' as const,
          content: msg.content
        };
      } else {
        return {
          role: 'assistant' as const,
          content: msg.content
        };
      }
    });

    // If this is a new conversation, add the system prompt as the first message
    if (messages.length === 0 || messages[0].content.indexOf("You are an AI rubber duck") === -1) {
      formattedMessages.unshift({
        role: 'system' as const,
        content: RUBBER_DUCK_PROMPT
      });
    }

    // Use the OpenAI SDK with the properly formatted messages
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: formattedMessages,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error calling Together API:', error);
    throw error;
  }
};
