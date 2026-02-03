'use client';

import { useEffect, useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

interface ChatbotConfig {
  model: string;
  systemPrompt: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
}

const defaultConfig: ChatbotConfig = {
  model: 'rule-based',
  systemPrompt: 'You are a helpful assistant.',
  businessName: 'My Business',
  primaryColor: '#374151',
  welcomeMessage: 'Hello! How can I help you today?',
};

export default function PreviewPage() {
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig);

  useEffect(() => {
    const stored = localStorage.getItem('chatbot-config');
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Widget Preview</h1>
          <p className="text-gray-600 mb-4">
            This page demonstrates how the chatbot widget will appear on your website.
            Click the chat button in the bottom-right corner to test it.
          </p>
          <a href="/" className="text-gray-800 underline">
            ← Back to Configuration
          </a>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Page Content</h2>
          <p className="text-gray-600 mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p className="text-gray-600 mb-4">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>

      <ChatWidget config={config} />
    </div>
  );
}
