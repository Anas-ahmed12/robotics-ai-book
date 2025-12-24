import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Function to get selected text from the page
  const getSelectedText = () => {
    const selectedText = window.getSelection().toString().trim();
    return selectedText;
  };

  // Add event listener for text selection
  useEffect(() => {
    const handleSelection = () => {
      setTimeout(() => {
        const selected = getSelectedText();
        if (selected && selected.length > 0) {
          // Append selected text to the current input value
          setInputValue(prevValue => {
            if (prevValue.trim() === '') {
              return selected;
            } else {
              return prevValue + ' ' + selected;
            }
          });
        }
      }, 0);
    };

    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat and clear input immediately for UX feedback
    setMessages(prev => [...prev, userMessage]);
    const originalInputValue = inputValue; // Store original value in case of error
    setInputValue('');
    // Also clear the DOM value to ensure both state and DOM are cleared
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8001/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: originalInputValue, // Use the original value that was sent
          session_id: 'docusaurus-chat-session', // Use a fixed session ID for the session
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        sender: 'bot',
        error: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Restore the input value on error so user can try again
      setInputValue(originalInputValue);
      // Also restore the DOM value to ensure both state and DOM match
      if (inputRef.current) {
        inputRef.current.value = originalInputValue;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        className="chatbot-float-button"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H16.58L20.29 20.71C20.4773 20.8985 20.5856 21.1541 20.5887 21.4219C20.5919 21.6897 20.4896 21.9458 20.3052 22.1353C20.1207 22.3248 19.8707 22.4291 19.6073 22.4291C19.3439 22.4291 19.0939 22.3248 18.9094 22.1353L15 18.29V17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Chatbot modal */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Book Assistant</h3>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-clear-button"
                onClick={clearChat}
                title="Clear chat"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.3335 4V2.66667C5.3335 2.31305 5.47404 1.97381 5.72408 1.72377C5.97412 1.47373 6.31336 1.33333 6.66683 1.33333H9.3335C9.68697 1.33333 10.0262 1.47373 10.2763 1.72377C10.5263 1.97381 10.6668 2.31305 10.6668 2.66667V4M12.6668 4V13.3333C12.6668 13.6869 12.5264 14.0262 12.2764 14.2762C12.0263 14.5263 11.6871 14.6667 11.3335 14.6667H4.66683C4.31326 14.6667 3.97402 14.5263 3.72398 14.2762C3.47394 14.0262 3.3335 13.6869 3.3335 13.3333V4H12.6668ZM7.3335 9.33333V6.66667M8.66683 9.33333V6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="chatbot-close-button"
                onClick={toggleChat}
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-welcome">
                <h4>Hello! I'm your Robotics AI Book Assistant</h4>
                <p>Ask me anything about the book content. You can also select text on the page and ask questions about it!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-content">
                    <div className="message-text">
                      {message.text}
                    </div>
                    {message.sources && message.sources.length > 0 && !message.error && (
                      <div className="message-sources">
                        <details>
                          <summary>Sources</summary>
                          {message.sources.map((source, index) => (
                            <div key={index} className="source-item">
                              <p>{source.content.substring(0, 150)}{source.content.length > 150 ? '...' : ''}</p>
                            </div>
                          ))}
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chatbot-message bot-message">
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>


          <div className="chatbot-input-area">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about the Robotics AI Book…"
              disabled={isLoading}
              rows={1}
              className="chatbot-input"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="chatbot-send-button"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3332 9.16667L10.8332 1.66667L9.1665 3.33333L14.5832 8.75H1.6665V11.25H14.5832L9.1665 16.6667L10.8332 18.3333L18.3332 10.8333V9.16667Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;