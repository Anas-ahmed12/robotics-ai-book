/**
 * Unit tests for the ChatInterface component
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test-container"></div></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getSelection = dom.window.getSelection.bind(dom.window);

// Mock localStorage and sessionStorage
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

Object.defineProperty(global.window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch API
global.fetch = jest.fn();

// Mock the RAGChatbot namespace
global.window.RAGChatbot = {
  constants: {
    API_TIMEOUT: 30000,
    MAX_MESSAGE_LENGTH: 2000,
    MAX_SELECTED_TEXT_LENGTH: 1000,
    MAX_HISTORY_MESSAGES: 100,
    MESSAGE_STATUS: {
      SENT: 'sent',
      PENDING: 'pending',
      DELIVERED: 'delivered',
      ERROR: 'error'
    },
    SENDER_TYPES: {
      USER: 'user',
      AGENT: 'agent'
    },
    SESSION_STORAGE_KEYS: {
      CONVERSATION_HISTORY: 'rag-chat-conversation-history',
      SESSION_ID: 'rag-chat-session-id',
      TIMESTAMP: 'rag-chat-timestamp'
    },
    EVENT_TYPES: {
      MESSAGE_SENT: 'messageSent',
      MESSAGE_RECEIVED: 'messageReceived',
      SESSION_STARTED: 'sessionStarted',
      SESSION_ENDED: 'sessionEnded'
    },
    DEFAULT_MESSAGES: {
      ERROR_MESSAGE: 'Sorry, I encountered an error processing your request. Please try again.',
      TIMEOUT_MESSAGE: 'Request timed out. Please try again.',
      WELCOME_MESSAGE: 'Hello! I\'m your AI assistant for the Robotics-AI Book. Ask me anything.'
    }
  },
  validators: {
    validateMessage: jest.fn(),
    validateSelectedText: jest.fn(),
    validateSessionId: jest.fn(),
    validateApiResponse: jest.fn(),
    validateUrl: jest.fn()
  },
  apiService: {
    sendQuery: jest.fn(),
    testConnection: jest.fn()
  },
  sessionManager: {
    initializeSession: jest.fn(),
    getCurrentSession: jest.fn(),
    saveSession: jest.fn(),
    addMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    clearConversationHistory: jest.fn(),
    endSession: jest.fn(),
    updateMessage: jest.fn()
  },
  textSelection: {
    setupSelectionListener: jest.fn(),
    getSelectionDetails: jest.fn(),
    prepareContextForApi: jest.fn()
  },
  MessageBubble: {
    create: jest.fn(),
    update: jest.fn()
  },
  InputArea: {
    create: jest.fn()
  }
};

// Import the ChatInterface class
const ChatInterface = require('../../../src/components/ChatInterface');

describe('ChatInterface', () => {
  let container;
  let chatInterface;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset DOM
    container = document.getElementById('test-container');
    container.innerHTML = '';

    // Setup common mock returns
    window.RAGChatbot.sessionManager.getCurrentSession.mockReturnValue({
      sessionId: 'test-session-123',
      createdAt: new Date().toISOString(),
      conversationHistory: [],
      isActive: true
    });

    window.RAGChatbot.sessionManager.initializeSession.mockReturnValue({
      sessionId: 'test-session-123',
      createdAt: new Date().toISOString(),
      conversationHistory: [],
      isActive: true
    });

    window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateApiResponse.mockReturnValue({ isValid: true });
  });

  describe('constructor', () => {
    test('should create a new ChatInterface instance', () => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      expect(chatInterface).toBeInstanceOf(ChatInterface);
      expect(chatInterface.containerId).toBe('test-container');
      expect(chatInterface.options.backendUrl).toBe('http://test-backend/api/chat');
    });

    test('should use default options when none provided', () => {
      chatInterface = new ChatInterface('test-container');

      expect(chatInterface.options.backendUrl).toBe('');
      expect(chatInterface.options.theme).toBeUndefined();
      expect(chatInterface.options.enableTextSelection).toBe(true);
    });

    test('should handle missing container', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      chatInterface = new ChatInterface('non-existent-container');

      expect(consoleSpy).toHaveBeenCalledWith('Container with ID \'non-existent-container\' not found');
      consoleSpy.mockRestore();
    });
  });

  describe('init', () => {
    test('should initialize the chat interface', () => {
      const createUISpy = jest.spyOn(ChatInterface.prototype, 'createUI').mockImplementation();
      const initializeSessionSpy = jest.spyOn(ChatInterface.prototype, 'initializeSession').mockImplementation();
      const setupEventListenersSpy = jest.spyOn(ChatInterface.prototype, 'setupEventListeners').mockImplementation();
      const setupTextSelectionListenerSpy = jest.spyOn(ChatInterface.prototype, 'setupTextSelectionListener').mockImplementation();
      const loadConversationHistorySpy = jest.spyOn(ChatInterface.prototype, 'loadConversationHistory').mockImplementation();
      const addWelcomeMessageSpy = jest.spyOn(ChatInterface.prototype, 'addWelcomeMessage').mockImplementation();

      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      expect(createUISpy).toHaveBeenCalled();
      expect(initializeSessionSpy).toHaveBeenCalled();
      expect(setupEventListenersSpy).toHaveBeenCalled();
      expect(setupTextSelectionListenerSpy).toHaveBeenCalled();
      expect(loadConversationHistorySpy).toHaveBeenCalled();
      expect(addWelcomeMessageSpy).toHaveBeenCalled();

      createUISpy.mockRestore();
      initializeSessionSpy.mockRestore();
      setupEventListenersSpy.mockRestore();
      setupTextSelectionListenerSpy.mockRestore();
      loadConversationHistorySpy.mockRestore();
      addWelcomeMessageSpy.mockRestore();
    });
  });

  describe('createUI', () => {
    test('should create the UI elements', () => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      chatInterface.createUI();

      // Check that UI elements are created
      const chatContainer = container.querySelector('.rag-chat-container');
      expect(chatContainer).toBeTruthy();

      const header = container.querySelector('.rag-chat-header');
      expect(header).toBeTruthy();

      const messagesContainer = container.querySelector('.rag-chat-messages');
      expect(messagesContainer).toBeTruthy();

      const inputContainer = container.querySelector('.rag-chat-input-container');
      expect(inputContainer).toBeTruthy();

      const inputArea = container.querySelector('.rag-chat-input');
      expect(inputArea).toBeTruthy();

      const submitBtn = container.querySelector('.rag-chat-submit-btn');
      expect(submitBtn).toBeTruthy();
    });
  });

  describe('handleSendMessage', () => {
    beforeEach(() => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Mock the UI elements
      chatInterface.createUI();
      chatInterface.inputArea = container.querySelector('#rag-chat-input');
      chatInterface.submitBtn = container.querySelector('#rag-chat-submit');
      chatInterface.messagesContainer = container.querySelector('#rag-chat-messages');
      chatInterface.session = {
        sessionId: 'test-session-123',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };
    });

    test('should handle sending a message successfully', async () => {
      // Setup mock API response
      const mockResponse = {
        response: 'This is a test response',
        sources: [],
        query_id: 'test-query-id',
        response_id: 'test-response-id',
        confidence_score: 0.95
      };

      window.RAGChatbot.apiService.sendQuery.mockResolvedValue(mockResponse);
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });

      // Set input value
      chatInterface.inputArea.value = 'Test question';
      chatInterface.inputArea.dispatchEvent(new Event('input', { bubbles: true }));

      // Call handleSendMessage
      await chatInterface.handleSendMessage();

      // Verify API was called
      expect(window.RAGChatbot.apiService.sendQuery).toHaveBeenCalledWith(
        'Test question',
        'test-session-123',
        null, // No context
        'http://test-backend/api/chat'
      );

      // Verify session manager methods were called
      expect(window.RAGChatbot.sessionManager.addMessage).toHaveBeenCalledTimes(2); // User and agent messages
    });

    test('should handle sending a message with context', async () => {
      // Setup mock API response
      const mockResponse = {
        response: 'Response with context',
        sources: [],
        query_id: 'test-query-id',
        response_id: 'test-response-id',
        confidence_score: 0.90
      };

      window.RAGChatbot.apiService.sendQuery.mockResolvedValue(mockResponse);
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });

      // Set up context
      chatInterface.selectedTextContext = {
        selected_text: 'This is selected text',
        source_url: 'http://test-book/page1'
      };

      // Set input value
      chatInterface.inputArea.value = 'Test question with context';
      chatInterface.inputArea.dispatchEvent(new Event('input', { bubbles: true }));

      // Call handleSendMessage
      await chatInterface.handleSendMessage();

      // Verify API was called with context
      expect(window.RAGChatbot.apiService.sendQuery).toHaveBeenCalledWith(
        'Test question with context',
        'test-session-123',
        chatInterface.selectedTextContext,
        'http://test-backend/api/chat'
      );
    });

    test('should handle validation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Setup validation to fail
      window.RAGChatbot.validators.validateMessage.mockReturnValue({
        isValid: false,
        error: 'Invalid message'
      });

      // Set input value
      chatInterface.inputArea.value = 'Invalid message';
      chatInterface.inputArea.dispatchEvent(new Event('input', { bubbles: true }));

      // Call handleSendMessage
      await chatInterface.handleSendMessage();

      // Verify error was displayed
      expect(consoleSpy).toHaveBeenCalledWith('Validation error:', 'Invalid message');
      consoleSpy.mockRestore();
    });

    test('should handle API errors', async () => {
      // Setup mock API to throw error
      window.RAGChatbot.apiService.sendQuery.mockRejectedValue(new Error('API Error'));
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });

      // Set input value
      chatInterface.inputArea.value = 'Test question';
      chatInterface.inputArea.dispatchEvent(new Event('input', { bubbles: true }));

      // Call handleSendMessage
      await chatInterface.handleSendMessage();

      // Verify error handling
      expect(window.RAGChatbot.sessionManager.updateMessage).toHaveBeenCalled();
    });
  });

  describe('displayMessage', () => {
    beforeEach(() => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Mock the UI elements
      chatInterface.createUI();
      chatInterface.messagesContainer = container.querySelector('#rag-chat-messages');
    });

    test('should display a message in the chat interface', () => {
      const message = {
        id: 'test-message-1',
        sender: 'user',
        content: 'Test message content',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      // Mock MessageBubble.create to return a simple div
      window.RAGChatbot.MessageBubble.create = jest.fn(() => {
        const div = document.createElement('div');
        div.className = 'rag-message-bubble';
        div.dataset.messageId = message.id;
        return div;
      });

      chatInterface.displayMessage(message);

      // Verify MessageBubble.create was called
      expect(window.RAGChatbot.MessageBubble.create).toHaveBeenCalledWith(message);

      // Verify message element was added to container
      const messageBubble = chatInterface.messagesContainer.querySelector('.rag-message-bubble');
      expect(messageBubble).toBeTruthy();
      expect(messageBubble.dataset.messageId).toBe('test-message-1');
    });
  });

  describe('handleTextSelection', () => {
    beforeEach(() => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });
    });

    test('should handle text selection and store context', () => {
      const selectionDetails = {
        selectedText: 'Selected text from page',
        sourceUrl: 'http://test-book/page1',
        timestamp: new Date().toISOString()
      };

      chatInterface.handleTextSelection(selectionDetails);

      expect(chatInterface.selectedTextContext).toEqual(selectionDetails);
    });

    test('should handle null or empty text selection', () => {
      chatInterface.handleTextSelection(null);
      expect(chatInterface.selectedTextContext).toBeNull();

      chatInterface.handleTextSelection({ selectedText: '' });
      expect(chatInterface.selectedTextContext).toBeNull();
    });
  });

  describe('scrollToBottom', () => {
    beforeEach(() => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Mock the UI elements
      chatInterface.createUI();
      chatInterface.messagesContainer = container.querySelector('#rag-chat-messages');
    });

    test('should scroll to the bottom of the messages container', () => {
      const scrollTopSpy = jest.spyOn(chatInterface.messagesContainer, 'scrollTop', 'set');

      chatInterface.scrollToBottom();

      // Verify scrollTop was set to scrollHeight
      expect(scrollTopSpy).toHaveBeenCalledWith(chatInterface.messagesContainer.scrollHeight);
    });
  });

  describe('destroy', () => {
    test('should clean up the chat interface', () => {
      chatInterface = new ChatInterface('test-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Mock the event listeners
      chatInterface.submitBtn = document.createElement('button');
      chatInterface.inputArea = document.createElement('textarea');

      const removeEventListenerSpy = jest.spyOn(EventTarget.prototype, 'removeEventListener');

      chatInterface.destroy();

      // Verify event listeners were removed
      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });
});