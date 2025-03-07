
import React, { useEffect, useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../contexts/ChatContext';
import { AlertTriangle, PanelLeft, Download, Upload, Trash2, Edit, Save, Check, X, PlusCircle } from 'lucide-react';
import { useAiSettings } from '../contexts/AiSettingsContext';
import SettingsDialog from './SettingsDialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { importConversations, exportConversations } from '../lib/storage';
import { toast } from 'sonner';

const DuckChat: React.FC = () => {
  const { 
    currentConversation, 
    conversations, 
    sendMessage, 
    isLoading, 
    error, 
    startNewConversation,
    loadConversation,
    deleteConversation 
  } = useChat();
  
  const { hasCurrentProviderApiKey, showSettingsDialog } = useAiSettings();
  const [showSidebar, setShowSidebar] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  
  // Show settings dialog if no API key is set for the selected provider
  useEffect(() => {
    if (!hasCurrentProviderApiKey()) {
      showSettingsDialog();
    }
  }, [hasCurrentProviderApiKey, showSettingsDialog]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleEditTitle = (id: string, title: string) => {
    setEditingTitle(id);
    setNewTitle(title);
  };

  const handleSaveTitle = (id: string) => {
    if (newTitle.trim()) {
      const conversation = conversations.find(conv => conv.id === id);
      if (conversation) {
        sendMessage('', { updateTitle: newTitle.trim() });
        setEditingTitle(null);
        setNewTitle('');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(null);
    setNewTitle('');
  };

  const handleExport = () => {
    const dataStr = exportConversations();
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `rubber-duck-conversations-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Conversations exported successfully');
  };

  const handleImport = () => {
    try {
      const success = importConversations(importData);
      if (success) {
        setShowImportDialog(false);
        setImportData('');
        window.location.reload(); // Reload to show imported conversations
        toast.success('Conversations imported successfully');
      } else {
        toast.error('Failed to import conversations');
      }
    } catch (err) {
      toast.error('Invalid JSON data');
    }
  };

  return (
    <div className="flex h-[calc(100vh-13rem)]">
      {/* Conversation Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r shrink-0 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">Conversations</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={handleExport} title="Export conversations">
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowImportDialog(true)} 
                title="Import conversations"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={startNewConversation}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New conversation
            </Button>
            
            {conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`group flex items-center p-2 rounded-md ${currentConversation?.id === conv.id 
                  ? 'bg-secondary' 
                  : 'hover:bg-secondary/50'}`}
              >
                <div 
                  className="flex-grow cursor-pointer truncate"
                  onClick={() => loadConversation(conv.id)}
                >
                  {editingTitle === conv.id ? (
                    <div className="flex items-center">
                      <Input 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSaveTitle(conv.id)}
                        className="h-7 w-7"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCancelEdit}
                        className="h-7 w-7"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm">{conv.title}</span>
                  )}
                </div>
                
                {currentConversation?.id === conv.id && editingTitle !== conv.id && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleEditTitle(conv.id, conv.title)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteConversation(conv.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main chat area */}
      <div className={`flex flex-col ${showSidebar ? 'flex-grow' : 'w-full'}`}>
        <div className="flex items-center p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <PanelLeft className={`h-4 w-4 ${!showSidebar && 'transform rotate-180'}`} />
          </Button>
          <h2 className="font-medium truncate">
            {currentConversation?.title || 'New Conversation'}
          </h2>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 m-4 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>{error}</span>
            </div>
          )}
          
          <MessageList 
            messages={currentConversation?.messages || []} 
            isLoading={isLoading} 
          />
        </div>
        
        <div className="p-4 border-t">
          <MessageInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
          />
        </div>
      </div>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Conversations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Paste your exported conversation JSON below.
            </p>
            <textarea
              className="w-full h-40 p-2 text-sm border rounded-md"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"conversations": [...]}'
            ></textarea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <SettingsDialog />
    </div>
  );
};

export default DuckChat;
