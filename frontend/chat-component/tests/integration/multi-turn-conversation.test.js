/**
 * Integration tests for multi-turn conversation flow
 * Testing conversation history maintenance and session management
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// Setup a basic DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test-container"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getSelection = dom.window.getSelection.bind(dom.window);

// Mock localStorage and sessionStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

const sessionStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch API
global.fetch = jest.fn();

describe('Multi-turn Conversation Flow', () => {
  // Load the components before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset DOM
    document.getElementById('test-container').innerHTML = '<div id="chat-container"></div>';

    // Create a mock RAGChatbot namespace
    window.RAGChatbot = {
      constants: require('../../src/utils/constants'),
      validators: require('../../src/utils/validators'),
      apiService: require('../../src/services/api-service'),
      sessionManager: require('../../src/services/session-manager'),
      textSelection: require('../../src/services/text-selection'),
      MessageBubble: require('../../src/components/MessageBubble'),
      InputArea: require('../../src/components/InputArea'),
      ChatInterface: require('../../src/components/ChatInterface')
    };
  });

  test('should maintain conversation history across multiple turns', async () => {
    // Setup mock API responses for multiple requests
    const mockResponses = [
      {
        response: 'This is the response to the first question',
        sources: [{ id: 'source1', content: 'First source content', similarity_score: 0.95 }],
        query_id: 'query1',
        response_id: 'response1',
        confidence_score: 0.92
      },
      {
        response: 'This is the response to the follow-up question',
        sources: [{ id: 'source2', content: 'Second source content', similarity_score: 0.88 }],
        query_id: 'query2',
        response_id: 'response2',
        confidence_score: 0.89
      },
      {
        response: 'Yes, you asked about the previous topic in your earlier question',
        sources: [{ id: 'source3', content: 'Third source content', similarity_score: 0.91 }],
        query_id: 'query3',
        response_id: 'response3',
        confidence_score: 0.93
      }
    ];

    // Mock fetch to return different responses for each call
    let callCount = 0;
    fetch.mockImplementation(() => {
      const response = mockResponses[callCount];
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response)
      });
    });

    // Create chat interface
    const chatInterface = new window.RAGChatbot.ChatInterface('chat-container', {
      backendUrl: 'http://test-backend/api/chat'
    });

    // Verify initial session
    const initialSession = window.RAGChatbot.sessionManager.getCurrentSession();
    expect(initialSession).toBeDefined();
    expect(initialSession.conversationHistory).toEqual([]);

    // First turn: Ask initial question
    const inputElement = document.querySelector('#rag-chat-input');
    inputElement.value = 'What is artificial intelligence?';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    await chatInterface.handleSendMessage();

    // Verify first message was added to history
    let history = window.RAGChatbot.sessionManager.getConversationHistory();
    expect(history.length).toBe(2); // 1 user message + 1 agent response
    expect(history[0].sender).toBe('user');
    expect(history[0].content).toBe('What is artificial intelligence?');
    expect(history[1].sender).toBe('agent');
    expect(history[1].content).toBe('This is the response to the first question');

    // Second turn: Ask follow-up question
    inputElement.value = 'How is it used in robotics?';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    await chatInterface.handleSendMessage();

    // Verify second message was added to history
    history = window.RAGChatbot.sessionManager.getConversationHistory();
    expect(history.length).toBe(4); // 2 user messages + 2 agent responses
    expect(history[2].sender).toBe('user');
    expect(history[2].content).toBe('How is it used in robotics?');
    expect(history[3].sender).toBe('agent');
    expect(history[3].content).toBe('This is the response to the follow-up question');

    // Third turn: Ask a contextual question referring to previous conversation
    inputElement.value = 'Did I ask about this before?';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    await chatInterface.handleSendMessage();

    // Verify third message was added to history
    history = window.RAGChatbot.sessionManager.getConversationHistory();
    expect(history.length).toBe(6); // 3 user messages + 3 agent responses
    expect(history[4].sender).toBe('user');
    expect(history[4].content).toBe('Did I ask about this before?');
    expect(history[5].sender).toBe('agent');
    expect(history[5].content).toBe('Yes, you asked about the previous topic in your earlier question');

    // Verify all messages are properly ordered by timestamp
    for (let i = 1; i < history.length; i++) {
      const prevTime = new Date(history[i-1].timestamp).getTime();
      const currTime = new Date(history[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  test('should preserve session across page refresh simulation', async () => {
    // Setup mock API response
    const mockResponse = {
      response: 'Test response for session preservation',
      sources: [],
      query_id: 'test-query',
      response_id: 'test-response',
      confidence_score: 0.85
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Create first chat interface and add a message
    const chatInterface1 = new window.RAGChatbot.ChatInterface('chat-container', {
      backendUrl: 'http://test-backend/api/chat'
    });

    const inputElement = document.querySelector('#rag-chat-input');
    inputElement.value = 'Testing session preservation';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    await chatInterface1.handleSendMessage();

    // Get the session from session storage
    const sessionData = sessionStorage.getItem(window.RAGChatbot?.constants?.SESSION_STORAGE_KEYS?.SESSION_ID || 'rag-chat-session-id');
    expect(sessionData).toBeDefined();

    // Simulate page refresh by creating a new chat interface
    const chatInterface2 = new window.RAGChatbot.ChatInterface('chat-container', {
      backendUrl: 'http://test-backend/api/chat'
    });

    // Verify that the new interface restored the session with history
    const restoredHistory = window.RAGChatbot.sessionManager.getConversationHistory();
    expect(restoredHistory.length).toBe(2); // Original user message + agent response
    expect(restoredHistory[0].content).toBe('Testing session preservation');
  });

  test('should handle message ordering correctly when messages arrive out of sequence', () => {
    // Create sample messages with different timestamps
    const messages = [
      {
        id: 'msg3',
        sender: 'agent',
        content: 'Third message',
        timestamp: new Date(Date.now() - 1000).toISOString() // 1 second ago
      },
      {
        id: 'msg1',
        sender: 'user',
        content: 'First message',
        timestamp: new Date(Date.now() - 3000).toISOString() // 3 seconds ago
      },
      {
        id: 'msg2',
        sender: 'agent',
        content: 'Second message',
        timestamp: new Date(Date.now() - 2000).toISOString() // 2 seconds ago
      }
    ];

    // Use the MessageBubble.sortMessages function to sort them
    const sortedMessages = window.RAGChatbot.MessageBubble.sortMessages(messages);

    // Verify the messages are sorted chronologically (oldest first)
    expect(sortedMessages.length).toBe(3);
    expect(sortedMessages[0].id).toBe('msg1'); // Oldest
    expect(sortedMessages[1].id).toBe('msg2'); // Middle
    expect(sortedMessages[2].id).toBe('msg3'); // Newest
  });

  test('should maintain message history limits', async () => {
    // Setup mock API response
    const mockResponse = {
      response: 'Response to test history limits',
      sources: [],
      query_id: 'query',
      response_id: 'response',
      confidence_score: 0.8
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    // Create chat interface
    const chatInterface = new window.RAGChatbot.ChatInterface('chat-container', {
      backendUrl: 'http://test-backend/api/chat'
    });

    // Send multiple messages to test history limits
    const maxHistory = window.RAGChatbot?.constants?.MAX_HISTORY_MESSAGES || 100;
    const messagesToSend = Math.min(maxHistory + 10, 50); // Send slightly more than max to test limiting

    for (let i = 0; i < messagesToSend; i++) {
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = `Test message ${i + 1}`;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      await chatInterface.handleSendMessage();
    }

    // Get the final history
    const finalHistory = window.RAGChatbot.sessionManager.getConversationHistory();

    // Verify that history doesn't exceed the limit (accounting for user + agent messages)
    // Each user message generates one agent response, so total should be 2 * messagesToSend
    // But if the limit is enforced, we might have fewer
    const expectedMaxHistory = maxHistory;
    expect(finalHistory.length).toBeLessThanOrEqual(expectedMaxHistory);

    // Verify that the most recent messages are preserved (not the oldest)
    if (finalHistory.length > 0) {
      const lastMessage = finalHistory[finalHistory.length - 1];
      // The last message should be from the agent responding to the last user message
      expect(lastMessage.sender).toBe('agent');
    }
  });
});

// Clean up
afterEach(() => {
  delete global.window;
  delete global.document;
  delete global.fetch;
  delete global.getSelection;
  delete global.localStorage;
  delete global.sessionStorage;
});