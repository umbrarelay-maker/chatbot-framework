'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatbotConfig {
  model: string;
  systemPrompt: string;
  businessName: string;
  primaryColor: string;
  welcomeMessage: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  config: ChatbotConfig;
}

// Rule-based response generator for MVP
function generateResponse(message: string, config: ChatbotConfig): string {
  const lowerMessage = message.toLowerCase();
  
  // Greeting patterns
  if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    return `Hello! Welcome to ${config.businessName}. How can I assist you today?`;
  }
  
  // Hours/schedule
  if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('schedule')) {
    return `Our business hours are Monday through Friday, 9 AM to 5 PM. Is there anything else I can help you with?`;
  }
  
  // Contact
  if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone') || lowerMessage.includes('reach')) {
    return `You can reach us through our contact page or email us directly. Would you like me to help you with something specific?`;
  }
  
  // Help
  if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
    return `I'm here to help! You can ask me about our services, hours, contact information, or any other questions you might have.`;
  }
  
  // Pricing
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing') || lowerMessage.includes('how much')) {
    return `For detailed pricing information, please contact our sales team directly. They'll be happy to provide you with a customized quote.`;
  }
  
  // Thanks
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return `You're welcome! Is there anything else I can help you with?`;
  }
  
  // Bye
  if (lowerMessage.match(/(bye|goodbye|see you|take care)/)) {
    return `Thank you for chatting with ${config.businessName}! Have a great day!`;
  }
  
  // Default response
  return `Thank you for your message. While I'm running in demo mode with limited responses, our team would be happy to help you with more specific questions. Is there anything else I can assist you with?`;
}

export default function ChatWidget({ config }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: config.welcomeMessage }]);
    }
  }, [isOpen, config.welcomeMessage, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsTyping(true);
    
    // Simulate response delay
    setTimeout(() => {
      const response = generateResponse(userMessage, config);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 500 + Math.random() * 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50"
        style={{ backgroundColor: config.primaryColor }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div 
            className="px-4 py-3 rounded-t-lg flex items-center gap-3"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium">{config.businessName}</h3>
              <p className="text-white/70 text-xs">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent text-gray-900"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: config.primaryColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
