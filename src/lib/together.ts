
import OpenAI from 'openai';

// Store the API key and model name
let apiKey = '';
let modelName = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'; // Default model
let client: OpenAI | null = null;

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('together_api_key', key);
  
  // Initialize the OpenAI client when the key is set
  if (key) {
    client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.together.xyz/v1',
      dangerouslyAllowBrowser: true, // Required flag for browser usage
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
      modelName = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';
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
          dangerouslyAllowBrowser: true, // Required flag for browser usage
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
      dangerouslyAllowBrowser: true, // Required flag for browser usage
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
        content: `You are an AI rubber duck debugging assistant. 
        When the developer explains a problem to you, respond with helpful, 
        thoughtful questions and guidance that will help them solve their own problem.
        Focus on being insightful rather than simply providing answers.
        Be concise and ask clarifying questions when needed.
        If the developer provides code, analyze it for potential issues.
        Respond conversationally as if you're an expert developer
        helping a colleague reason through their problem.`
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
