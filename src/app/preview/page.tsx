'use client';

import { useEffect, useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

interface ChatbotConfig {
  chatbotId?: string;
  model: string;
  systemPrompt: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
  widgetIcon?: string;
}

const defaultConfig: ChatbotConfig = {
  model: 'gemini-3-flash',
  systemPrompt: 'You are a helpful assistant.',
  businessName: 'My Business',
  primaryColor: '#18181b',
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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header 
        className="border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}
      >
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <a 
            href="/"
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--bg-primary)' }}>N</span>
            </div>
            Nyx Chat
          </a>
          <span 
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            Preview Mode
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-6">
        {/* Info */}
        <div 
          className="rounded-lg p-6 mb-8 animate-fade-in"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Widget Preview
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Click the chat button in the bottom-right corner to test your chatbot.
          </p>
        </div>

        {/* Sample Content */}
        <div 
          className="rounded-lg p-8 animate-fade-in"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-8 h-8 rounded-md"
              style={{ background: config.primaryColor }}
            />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {config.businessName}
            </span>
          </div>

          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Sample Page Content
          </h2>
          
          <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This is a sample page demonstrating how the chatbot widget integrates with your website. 
            The widget appears in the bottom-right corner, accessible to visitors without disrupting 
            their browsing experience.
          </p>

          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your chatbot is configured to use {config.model}. It can be customized with your own 
            knowledge base, brand colors, and personality through the admin panel.
          </p>
        </div>

        {/* Config Summary */}
        <div 
          className="rounded-lg p-4 mt-6 animate-fade-in"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Model</p>
              <p className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{config.model}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Business</p>
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{config.businessName}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Color</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: config.primaryColor }} />
                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                  {config.primaryColor}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Status</p>
              <p className="text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span style={{ color: 'var(--text-primary)' }}>Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ChatWidget config={config} />
    </div>
  );
}
