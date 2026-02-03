'use client';

import { useState, useEffect } from 'react';

interface ChatbotConfig {
  model: string;
  systemPrompt: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
}

const defaultConfig: ChatbotConfig = {
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant for our business. Be friendly and professional.',
  businessName: 'My Business',
  primaryColor: '#374151',
  welcomeMessage: 'Hello! How can I help you today?',
};

export default function AdminDashboard() {
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('chatbot-config');
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('chatbot-config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    const code = `<script src="${baseUrl}/widget.js" data-config="${encodedConfig}"></script>`;
    setEmbedCode(code);
    setShowEmbed(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Chatbot Configuration</h1>
          
          <div className="space-y-6">
            {/* Model Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-white text-gray-900"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
                <option value="rule-based">Rule-based (MVP)</option>
              </select>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none text-gray-900"
                placeholder="Define how your chatbot should behave..."
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={config.businessName}
                onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                placeholder="Your Business Name"
              />
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent font-mono text-gray-900"
                />
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <input
                type="text"
                value={config.welcomeMessage}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
                placeholder="Hello! How can I help you today?"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                {saved ? '✓ Saved' : 'Save Configuration'}
              </button>
              <button
                onClick={generateEmbedCode}
                className="px-6 py-2 border border-gray-800 text-gray-800 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                Generate Embed Code
              </button>
            </div>

            {/* Embed Code Display */}
            {showEmbed && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Embed Code</span>
                  <button
                    onClick={copyToClipboard}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <p className="text-sm text-gray-600 mb-4">
            Visit <a href="/preview" className="text-gray-800 underline">/preview</a> to see your chatbot widget in action.
          </p>
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
              style={{ backgroundColor: config.primaryColor }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-2">Widget button preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}
