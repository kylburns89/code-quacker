
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { MessageSquare, Info, Github, Moon, Sun, Settings } from 'lucide-react';
import Duck from './Duck';
import { useTheme } from '../contexts/ThemeContext';
import { useAiSettings } from '../contexts/AiSettingsContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { showSettingsDialog } = useAiSettings();
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <Link to="/" className="flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <Duck size="sm" animate={false} className="w-8 h-8" />
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Code<span className="text-primary">Quacker</span>
              </span>
            </div>
            <span className="text-xs italic text-accent-foreground -mt-1">
              Let's <i>quack</i> the code together!
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-md transition-colors hover:bg-secondary",
                location.pathname === "/" ? "bg-secondary font-medium" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </div>
            </Link>
            <Link
              to="/about"
              className={cn(
                "px-4 py-2 rounded-md transition-colors hover:bg-secondary",
                location.pathname === "/about" ? "bg-secondary font-medium" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>About</span>
              </div>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="AI Settings"
              onClick={showSettingsDialog}
              className="rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <Github className="w-5 h-5 text-muted-foreground" />
            </a>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="w-full border-t bg-background/80 backdrop-blur-xl py-4">
        <div className="container px-4 mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Code Quacker Debugging Assistant</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
