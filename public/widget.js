(function() {
  'use strict';

  // Get config from script tag
  const scriptTag = document.currentScript;
  const encodedConfig = scriptTag.getAttribute('data-config');
  
  let config;
  try {
    config = JSON.parse(decodeURIComponent(encodedConfig));
  } catch (e) {
    config = {
      model: 'rule-based',
      systemPrompt: 'You are a helpful assistant.',
      businessName: 'Chat Support',
      primaryColor: '#374151',
      welcomeMessage: 'Hello! How can I help you today?'
    };
  }

  // Rule-based response generator
  function generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return 'Hello! Welcome to ' + config.businessName + '. How can I assist you today?';
    }
    
    if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('schedule')) {
      return 'Our business hours are Monday through Friday, 9 AM to 5 PM. Is there anything else I can help you with?';
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone') || lowerMessage.includes('reach')) {
      return 'You can reach us through our contact page or email us directly. Would you like me to help you with something specific?';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
      return 'I\'m here to help! You can ask me about our services, hours, contact information, or any other questions you might have.';
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing') || lowerMessage.includes('how much')) {
      return 'For detailed pricing information, please contact our sales team directly. They\'ll be happy to provide you with a customized quote.';
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    
    if (lowerMessage.match(/(bye|goodbye|see you|take care)/)) {
      return 'Thank you for chatting with ' + config.businessName + '! Have a great day!';
    }
    
    return 'Thank you for your message. While I\'m running in demo mode with limited responses, our team would be happy to help you with more specific questions. Is there anything else I can assist you with?';
  }

  // Create widget container
  const container = document.createElement('div');
  container.id = 'chatbot-widget-container';
  document.body.appendChild(container);

  // Widget state
  let isOpen = false;
  let messages = [];

  // Styles
  const styles = document.createElement('style');
  styles.textContent = `
    #chatbot-widget-container * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chatbot-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;
      z-index: 99999;
    }
    
    .chatbot-button:hover {
      transform: scale(1.05);
    }
    
    .chatbot-button svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    .chatbot-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 384px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      z-index: 99999;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    
    .chatbot-panel.open {
      display: flex;
    }
    
    .chatbot-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .chatbot-header-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chatbot-header-icon svg {
      width: 16px;
      height: 16px;
      fill: white;
    }
    
    .chatbot-header-title {
      color: white;
      font-weight: 500;
      font-size: 16px;
    }
    
    .chatbot-header-status {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
    }
    
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }
    
    .chatbot-message {
      margin-bottom: 12px;
      display: flex;
    }
    
    .chatbot-message.user {
      justify-content: flex-end;
    }
    
    .chatbot-message.assistant {
      justify-content: flex-start;
    }
    
    .chatbot-message-content {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .chatbot-message.user .chatbot-message-content {
      background: #1f2937;
      color: white;
    }
    
    .chatbot-message.assistant .chatbot-message-content {
      background: white;
      color: #1f2937;
      border: 1px solid #e5e7eb;
    }
    
    .chatbot-typing {
      color: #6b7280;
      font-style: italic;
      padding: 10px 14px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      display: inline-block;
    }
    
    .chatbot-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
      background: white;
    }
    
    .chatbot-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    
    .chatbot-input:focus {
      border-color: #9ca3af;
      box-shadow: 0 0 0 2px rgba(156, 163, 175, 0.2);
    }
    
    .chatbot-send {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .chatbot-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    @media (max-width: 480px) {
      .chatbot-panel {
        width: calc(100% - 32px);
        right: 16px;
        bottom: 88px;
        height: 60vh;
      }
    }
  `;
  document.head.appendChild(styles);

  // Render function
  function render() {
    container.innerHTML = `
      <button class="chatbot-button" style="background-color: ${config.primaryColor}">
        ${isOpen 
          ? '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
          : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="8" cy="10" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/></svg>'
        }
      </button>
      
      <div class="chatbot-panel ${isOpen ? 'open' : ''}">
        <div class="chatbot-header" style="background-color: ${config.primaryColor}">
          <div class="chatbot-header-icon">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <div>
            <div class="chatbot-header-title">${config.businessName}</div>
            <div class="chatbot-header-status">Online</div>
          </div>
        </div>
        
        <div class="chatbot-messages" id="chatbot-messages">
          ${messages.map(m => `
            <div class="chatbot-message ${m.role}">
              <div class="chatbot-message-content">${m.content}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="chatbot-input-container">
          <input type="text" class="chatbot-input" placeholder="Type a message..." id="chatbot-input">
          <button class="chatbot-send" style="background-color: ${config.primaryColor}" id="chatbot-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    `;

    // Bind events
    container.querySelector('.chatbot-button').addEventListener('click', toggleChat);
    container.querySelector('#chatbot-send').addEventListener('click', sendMessage);
    container.querySelector('#chatbot-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    // Scroll to bottom
    const messagesEl = container.querySelector('#chatbot-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen && messages.length === 0) {
      messages.push({ role: 'assistant', content: config.welcomeMessage });
    }
    render();
    
    if (isOpen) {
      setTimeout(function() {
        container.querySelector('#chatbot-input').focus();
      }, 100);
    }
  }

  function sendMessage() {
    const input = container.querySelector('#chatbot-input');
    const text = input.value.trim();
    if (!text) return;

    messages.push({ role: 'user', content: text });
    render();

    // Simulate typing delay
    setTimeout(function() {
      const response = generateResponse(text);
      messages.push({ role: 'assistant', content: response });
      render();
    }, 500 + Math.random() * 500);
  }

  // Initial render
  render();
})();
