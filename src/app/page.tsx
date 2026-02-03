'use client';

import { useState, useEffect } from 'react';

interface ChatbotConfig {
  chatbotId?: string;
  model: string;
  systemPrompt: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
  widgetIcon: string;
  apiKey?: string;
  apiProvider?: 'openai' | 'anthropic' | 'google';
}

interface Document {
  id: string;
  name: string;
  source_type: string;
  created_at: string;
}

const defaultConfig: ChatbotConfig = {
  model: 'gemini-3-flash',
  systemPrompt: 'You are a helpful assistant for our business. Be friendly, professional, and concise.',
  businessName: 'My Business',
  primaryColor: '#18181b',
  welcomeMessage: 'Hello! How can I help you today?',
  widgetIcon: 'chat',
};

const widgetIcons = [
  { id: 'chat', name: 'Chat Bubble', path: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { id: 'message', name: 'Message', path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'support', name: 'Headset', path: 'M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z' },
  { id: 'help', name: 'Question', path: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'sparkle', name: 'Sparkle', path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { id: 'bolt', name: 'Lightning', path: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'robot', name: 'Robot', path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];

export default function AdminDashboard() {
  const [config, setConfig] = useState<ChatbotConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'knowledge' | 'conversations'>('config');
  const [copied, setCopied] = useState(false);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'text' | 'url'>('text');
  const [uploading, setUploading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('chatbot-config');
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge' && config.chatbotId) {
      fetchDocuments();
    }
  }, [activeTab, config.chatbotId]);

  const fetchDocuments = async () => {
    if (!config.chatbotId) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/documents?chatbotId=${config.chatbotId}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('chatbot-config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateEmbedCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const code = `<!-- Chatbot Widget -->
<script>
  window.chatbotConfig = ${JSON.stringify(config, null, 2)};
</script>
<script src="${baseUrl}/widget.js" async></script>`;
    setEmbedCode(code);
    setShowEmbed(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrapeUrl = async () => {
    if (!docUrl.trim()) return;
    
    setScraping(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: docUrl }),
      });
      
      const data = await res.json();
      if (data.success) {
        setDocName(data.title || new URL(docUrl).hostname);
        setDocContent(data.content);
        setUploadMode('text'); // Switch to text view to show extracted content
      } else {
        alert(`Scrape failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Scrape error:', error);
      alert('Failed to scrape URL');
    } finally {
      setScraping(false);
    }
  };

  const uploadDocument = async () => {
    if (!docName.trim() || !docContent.trim()) return;
    if (!config.chatbotId) {
      alert('Please save your chatbot configuration first to get a chatbot ID.');
      return;
    }
    
    setUploading(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbotId: config.chatbotId,
          name: docName,
          content: docContent,
          sourceType: docUrl ? 'url' : 'text',
          sourceUrl: docUrl || undefined,
        }),
      });
      
      const data = await res.json();
      if (data.document) {
        setDocuments(prev => [data.document, ...prev]);
        setDocName('');
        setDocContent('');
        setDocUrl('');
      } else if (data.error) {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    
    try {
      await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const tabs = [
    { id: 'config' as const, label: 'Configuration' },
    { id: 'knowledge' as const, label: 'Knowledge Base' },
    { id: 'conversations' as const, label: 'Conversations' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header 
        className="border-b sticky top-0 z-40 backdrop-blur-sm"
        style={{ borderColor: 'var(--border)', background: 'rgba(9, 9, 11, 0.8)' }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center logo-mark cursor-pointer" style={{ background: 'var(--text-primary)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--bg-primary)' }}>N</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Nyx Chat
            </h1>
            <span 
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            >
              Beta
            </span>
          </div>
          <a
            href="/preview"
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            Preview →
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-3 text-sm font-medium relative group"
              style={{
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <span className="relative z-10 transition-colors group-hover:text-[var(--text-primary)]">
                {tab.label}
              </span>
              <div 
                className="absolute bottom-0 left-0 right-0 h-px transition-all duration-200"
                style={{ 
                  background: 'var(--text-primary)',
                  opacity: activeTab === tab.id ? 1 : 0,
                  transform: activeTab === tab.id ? 'scaleX(1)' : 'scaleX(0)',
                }}
              />
            </button>
          ))}
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
            {/* Main Config */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                  SETTINGS
                </h2>
                
                <div className="space-y-5">
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Model
                    </label>
                    <select
                      value={config.model}
                      onChange={(e) => {
                        const model = e.target.value;
                        let provider: 'openai' | 'anthropic' | 'google' = 'openai';
                        if (model.startsWith('claude')) provider = 'anthropic';
                        if (model.startsWith('gemini')) provider = 'google';
                        setConfig({ ...config, model, apiProvider: provider });
                      }}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <optgroup label="OpenAI">
                        <option value="gpt-5.2">GPT-5.2</option>
                        <option value="gpt-5.2-mini">GPT-5.2 Mini</option>
                      </optgroup>
                      <optgroup label="Anthropic">
                        <option value="claude-haiku-4.5">Claude Haiku 4.5</option>
                        <option value="claude-sonnet-4">Claude Sonnet 4</option>
                      </optgroup>
                      <optgroup label="Google">
                        <option value="gemini-3-flash">Gemini 3 Flash</option>
                        <option value="gemini-3-pro">Gemini 3 Pro</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder={config.model?.startsWith('gpt') ? 'sk-...' : config.model?.startsWith('claude') ? 'sk-ant-...' : 'AIza...'}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {config.apiKey ? '✓ Key saved' : `Required for ${config.model?.startsWith('gpt') ? 'OpenAI' : config.model?.startsWith('claude') ? 'Anthropic' : 'Google'}`}
                    </p>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={config.businessName}
                      onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Your Business Name"
                    />
                  </div>

                  {/* Welcome Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Welcome Message
                    </label>
                    <input
                      type="text"
                      value={config.welcomeMessage}
                      onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Hello! How can I help you today?"
                    />
                  </div>

                  {/* System Prompt */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      System Prompt
                    </label>
                    <textarea
                      value={config.systemPrompt}
                      onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Define how your chatbot should behave..."
                    />
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Widget Color
                    </label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg cursor-pointer border"
                        style={{ background: config.primaryColor, borderColor: 'var(--border)' }}
                      >
                        <input
                          type="color"
                          value={config.primaryColor}
                          onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                          className="w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2.5 rounded-lg text-sm font-mono"
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Widget Icon */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Widget Icon
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {widgetIcons.map((icon) => (
                        <button
                          key={icon.id}
                          onClick={() => setConfig({ ...config, widgetIcon: icon.id })}
                          className="w-10 h-10 rounded-lg flex items-center justify-center group"
                          style={{ 
                            background: config.widgetIcon === icon.id ? config.primaryColor : 'var(--bg-secondary)',
                            border: `1px solid ${config.widgetIcon === icon.id ? config.primaryColor : 'var(--border)'}`,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (config.widgetIcon !== icon.id) {
                              e.currentTarget.style.borderColor = 'var(--text-muted)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (config.widgetIcon !== icon.id) {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }
                          }}
                          title={icon.name}
                        >
                          <svg 
                            className="w-5 h-5 transition-colors" 
                            fill="none" 
                            stroke={config.widgetIcon === icon.id ? 'white' : 'currentColor'}
                            style={{ color: config.widgetIcon === icon.id ? 'white' : 'var(--text-muted)' }}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon.path} />
                          </svg>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs mt-2 transition-all" style={{ color: 'var(--text-muted)' }}>
                      {widgetIcons.find(i => i.id === config.widgetIcon)?.name || 'Chat Bubble'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  >
                    {saved ? '✓ Saved' : 'Save'}
                  </button>
                  <button
                    onClick={generateEmbedCode}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Get Embed Code
                  </button>
                </div>

                {/* Embed Code */}
                {showEmbed && (
                  <div className="mt-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        EMBED CODE
                      </span>
                      <button
                        onClick={copyToClipboard}
                        className="text-xs font-medium transition-opacity hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre 
                      className="text-xs overflow-x-auto whitespace-pre-wrap p-4 rounded-lg"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      {embedCode}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Preview */}
              <div>
                <h3 className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                  PREVIEW
                </h3>
                <div 
                  className="rounded-lg p-8 flex flex-col items-center"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover-lift"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={widgetIcons.find(i => i.id === config.widgetIcon)?.path || widgetIcons[0].path} />
                    </svg>
                  </div>
                  <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                    {widgetIcons.find(i => i.id === config.widgetIcon)?.name || 'Chat Bubble'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                  STATUS
                </h3>
                <div 
                  className="rounded-lg p-4 space-y-3"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Documents</span>
                    <span style={{ color: 'var(--text-primary)' }}>{documents.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Model</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{config.model}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span style={{ color: 'var(--text-primary)' }}>Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Upload */}
            <div>
              <h2 className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                ADD DOCUMENT
              </h2>

              {/* Mode Switcher */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMode('text')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: uploadMode === 'text' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: uploadMode === 'text' ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: `1px solid ${uploadMode === 'text' ? 'var(--text-primary)' : 'var(--border)'}`,
                  }}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: uploadMode === 'url' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: uploadMode === 'url' ? 'var(--bg-primary)' : 'var(--text-muted)',
                    border: `1px solid ${uploadMode === 'url' ? 'var(--text-primary)' : 'var(--border)'}`,
                  }}
                >
                  Import URL
                </button>
              </div>
              
              <div className="space-y-4">
                {uploadMode === 'url' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        URL
                      </label>
                      <input
                        type="url"
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://example.com/page"
                        className="w-full px-3 py-2.5 rounded-lg text-sm"
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <button
                      onClick={scrapeUrl}
                      disabled={!docUrl.trim() || scraping}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                    >
                      {scraping ? 'Extracting...' : 'Extract Content'}
                    </button>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Extracts readable text from the page. Review before uploading.
                    </p>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder="FAQ, Product Info, etc."
                        className="w-full px-3 py-2.5 rounded-lg text-sm"
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Content
                      </label>
                      <textarea
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        rows={10}
                        placeholder="Paste content here..."
                        className="w-full px-3 py-2.5 rounded-lg text-sm resize-none font-mono"
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        {docContent.length.toLocaleString()} chars · ~{Math.max(1, Math.ceil(docContent.split(/\s+/).filter(Boolean).length / 500))} chunks
                      </p>
                    </div>

                    <button
                      onClick={uploadDocument}
                      disabled={!docName.trim() || !docContent.trim() || uploading}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                    >
                      {uploading ? 'Processing...' : 'Upload'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
                DOCUMENTS ({documents.length})
              </h2>
              
              {!config.chatbotId ? (
                <div 
                  className="rounded-lg p-6 text-center"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Save configuration first
                  </p>
                </div>
              ) : loadingDocs ? (
                <div 
                  className="rounded-lg p-6 text-center"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
                </div>
              ) : documents.length === 0 ? (
                <div 
                  className="rounded-lg p-6 text-center"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No documents yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg group cursor-default"
                      style={{ 
                        background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {doc.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div 
            className="rounded-lg p-12 text-center animate-fade-in"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
