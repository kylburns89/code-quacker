
import OpenAI from 'openai';

// Store the API key and model name
let apiKey = '';
let modelName = 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free'; // Default model
let client: OpenAI | null = null;

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem('together_api_key', key);
  
  // Initialize the OpenAI client when the key is set
  if (key) {
    client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.together.xyz/v1',
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
      modelName = 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free';
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
    });
  }

  try {
    // Format the conversation history for the Together API
    // The OpenAI SDK requires a specific format for the messages
    const formattedMessages: Array<{role: string, content: string}> = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // If this is a new conversation, add the system prompt as the first message
    if (messages.length === 0 || messages[0].content.indexOf("You are an AI rubber duck") === -1) {
      formattedMessages.unshift({
        role: 'system',
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

    // Make sure all the messages have valid roles for the OpenAI API
    const validMessages = formattedMessages.map(msg => {
      // Fix potential mismatch in role values
      if (msg.role !== 'system' && msg.role !== 'user' && msg.role !== 'assistant') {
        if (msg.role === 'model') {
          return { role: 'assistant', content: msg.content };
        }
        // Default to user if an unknown role is provided
        return { role: 'user', content: msg.content };
      }
      return msg;
    });

    // Use the OpenAI SDK with the properly formatted messages
    const completion = await client.chat.completions.create({
      model: getModelName(),
      messages: validMessages,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error calling Together API:', error);
    throw error;
  }
};
