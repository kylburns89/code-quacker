
import React from 'react';
import Layout from '../components/Layout';
import DuckChat from '../components/DuckChat';
import { ChatProvider } from '../contexts/ChatContext';

const Index: React.FC = () => {
  return (
    <ChatProvider>
      <Layout>
        <div className="flex flex-col w-full mx-auto">
          <DuckChat />
        </div>
      </Layout>
    </ChatProvider>
  );
};

export default Index;
