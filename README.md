# Code Quacker

![Code Quacker](https://github.com/user-attachments/assets/3c3cc542-15df-4805-a972-b7e353dfda71)


## About

Code Quacker is an AI-powered rubber duck debugging assistant that helps developers solve coding problems through thoughtful conversation. By explaining your code issues to the friendly duck assistant, you can often discover solutions on your own while getting intelligent guidance from AI.

## Features

- **AI-Powered Conversations**: Utilizes Google's Gemini AI and Together.ai to provide intelligent responses to your coding problems
- **Code-Focused**: Optimized for discussing and debugging code with syntax highlighting
- **Conversation Management**: Create, edit, save, and switch between multiple debugging sessions
- **Export/Import**: Save your conversations for future reference or sharing
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme

## Technologies

This project is built with:

- [Vite](https://vitejs.dev/) - Fast build tool and development server
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Reusable UI components
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives
- [React Router](https://reactrouter.com/) - Client-side routing
- [Google Generative AI](https://ai.google.dev/) - Gemini AI integration
- [Together AI](https://together.ai/) - Alternative AI provider
- [Prism.js](https://prismjs.com/) - Syntax highlighting for code blocks

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or [Bun](https://bun.sh/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/code-quacker.git
   cd code-quacker
   ```

2. Install dependencies:
   ```sh
   npm install
   # or with Bun
   bun install
   ```

3. Start the development server:
   ```sh
   npm run dev
   # or with Bun
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### API Keys

To use the AI features, you'll need to provide API keys:

1. For Google Gemini: Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. For OpenAI: Get an API key from [Together AI](https://www.together.ai/)

Enter these keys in the settings dialog when prompted.

## Usage

1. **Set up your API key**: Enter your Google Gemini or OpenAI API key when prompted
2. **Start a new conversation**: Click "New conversation" in the sidebar
3. **Explain your problem**: Clearly describe the issue you're facing, including relevant code snippets
4. **Engage in conversation**: Answer the duck's questions to explore your problem from different angles
5. **Find your solution**: Through the process of explanation and discussion, you'll often discover the solution yourself!

## Building for Production

To build the app for production:

```sh
npm run build
# or with Bun
bun run build
```

The built files will be in the `dist` directory, ready to be deployed to your hosting provider of choice.

## License

This project is open source and available under the [MIT License](LICENSE).
