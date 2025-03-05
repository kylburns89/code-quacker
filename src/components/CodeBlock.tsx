
import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = React.useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    if (!codeRef.current) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Code copied to clipboard",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: "Failed to copy code",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className="code-block group relative">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={copyToClipboard}
          className="h-8 w-8 bg-background/80 backdrop-blur-sm rounded-md"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between px-4 py-2 bg-muted/70 rounded-t-md border-b border-border text-xs text-muted-foreground">
        <span>{language}</span>
      </div>
      <pre 
        ref={codeRef}
        className="p-4 overflow-x-auto text-sm"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
