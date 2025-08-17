'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';

// HTML sanitization function to prevent XSS
const sanitizeHtml = (html) => {
  // Create a temporary div to parse and sanitize HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove all script tags and event handlers
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove all event handlers from elements
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(element => {
    const attributes = element.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attr = attributes[i];
      if (attr.name.startsWith('on') || attr.name.startsWith('javascript:')) {
        element.removeAttribute(attr.name);
      }
    }
  });
  
  return tempDiv.innerHTML;
};

// LaTeX rendering support
const renderLatex = (text) => {
  // Simple LaTeX pattern matching for common expressions
  return text.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
    // For now, just style it differently - you can integrate KaTeX here later
    return `<span class="bg-blue-50 px-2 py-1 rounded text-blue-800 font-mono text-sm">${latex}</span>`;
  }).replace(/\$(.*?)\$/g, (match, latex) => {
    return `<span class="bg-blue-50 px-1 rounded text-blue-800 font-mono text-sm">${latex}</span>`;
  });
};

// Simple markdown-like text renderer with LaTeX support
const formatText = (text) => {
  if (!text) return text;
  
  // Split by lines to handle line breaks properly
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) {
      return <br key={lineIndex} />;
    }
    
    // Handle headers
    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <div key={lineIndex} className="font-bold text-gray-900 mt-2 mb-1 text-sm">
          {line.replace(/\*\*/g, '')}
        </div>
      );
    }
    
    // Handle bullet points
    if (line.startsWith('•') || line.startsWith('-')) {
      return (
        <div key={lineIndex} className="flex items-start space-x-2 my-1">
          <span className="text-blue-500 font-bold mt-0.5 text-sm">•</span>
          <span className="flex-1 text-sm">{formatInlineText(line.replace(/^[•-]\s*/, ''))}</span>
        </div>
      );
    }
    
    // Regular lines
    return (
      <div key={lineIndex} className="my-1 text-sm">
        {formatInlineText(line)}
      </div>
    );
  });
};

// Format inline text (bold, LaTeX, etc.)
const formatInlineText = (text) => {
  if (!text) return text;
  
  // First handle LaTeX
  const withLatex = renderLatex(text);
  
  // Handle bold text **text**
  const parts = withLatex.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.replace(/\*\*/g, '')}
        </strong>
      );
    }
    // Check if part contains HTML (LaTeX rendering) - SANITIZE FIRST
    if (part.includes('<span class="bg-blue-50')) {
      const sanitizedPart = sanitizeHtml(part);
      return <span key={index} dangerouslySetInnerHTML={{ __html: sanitizedPart }} />;
    }
    return part;
  });
};



const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const savedMessages = localStorage.getItem('ai-chat-history');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } else {
          // Initialize with welcome message if no history
          const welcomeMessage = {
            id: 1,
            type: 'bot',
            content: "Hi! I'm your AI study assistant. I can help you with questions about your studies, practice problems, or test strategies. How can I help you today?",
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to welcome message
        const welcomeMessage = {
          id: 1,
          type: 'bot',
          content: "Hi! I'm your AI study assistant. I can help you with questions about your studies, practice problems, or test strategies. How can I help you today?",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      setIsInitialized(true);
    };

    loadChatHistory();
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      try {
        localStorage.setItem('ai-chat-history', JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const quickActions = [
    "Explain concept",
    "Practice tips", 
    "Study help",
    "Test strategy"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Create placeholder for streaming response
    const botMessageId = Date.now() + 1;
    const initialBotMessage = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      // Prepare conversation history for the API (last 10 messages for context)
      const recentMessages = [...messages, userMessage].slice(-10);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Check if response is streaming (SSE) or regular JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.done) {
                  // Streaming complete
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                  break;
                } else if (data.response) {
                  // Update streaming content
                  streamedContent += data.response;
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                      ? { ...msg, content: streamedContent }
                      : msg
                  ));
                }
              } catch (parseError) {
                console.log('Parse error:', parseError);
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json();
        const finalContent = data.response || 'Sorry, I encountered an error. Please try again.';
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, content: finalContent, isStreaming: false }
            : msg
        ));
      }
      
      if (!isOpen) {
        setHasNewMessage(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorContent = 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.';
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, content: errorContent, isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputValue(action);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Clear chat history function (optional - can be triggered by a button)
  const clearChatHistory = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: "Hi! I'm your AI study assistant. I can help you with questions about your studies, practice problems, or test strategies. How can I help you today?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem('ai-chat-history');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <button
          onClick={openChat}
          className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        >
          <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
          
          {/* Floating tooltip - hidden on mobile */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden md:block">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Study Assistant</span>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: Full screen overlay, Desktop: Bottom right positioned */}
      <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 md:w-96">
        {/* Mobile backdrop */}
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm" 
          onClick={closeChat}
        ></div>
        
        {/* Chat container */}
        <div className={`
          ${isMinimized 
            ? 'h-16' 
            : 'h-full md:h-[600px]'
          }
          w-full md:w-96
          bg-white 
          md:rounded-2xl 
          md:shadow-2xl 
          md:border md:border-gray-200
          fixed bottom-0 md:relative
          flex flex-col
          transition-all duration-300
        `}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 md:rounded-t-2xl flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">AI Study Assistant</h3>
                <span className="text-xs text-gray-500">Memory Active</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Hide minimize on mobile */}
              <button
                onClick={toggleMinimize}
                className="hidden md:block p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Minimize"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-r from-purple-600 to-blue-600'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <div className="text-sm leading-relaxed">
                          {message.type === 'user' ? (
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                          ) : (
                            <div>
                              {formatText(message.content)}
                            </div>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show typing indicator when loading but no streaming message exists */}
                {isLoading && !messages.some(msg => msg.isStreaming) && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-bl-md">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-full transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 md:rounded-b-2xl flex-shrink-0">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your studies..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm leading-relaxed shadow-sm text-black placeholder-black/50"
                      rows="1"
                      style={{ 
                        minHeight: '48px', 
                        maxHeight: '120px',
                        lineHeight: '1.5'
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AIChatBot; 