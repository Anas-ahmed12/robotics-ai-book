/**
 * Unit tests for the session manager
 */

// Mock the global sessionStorage
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

global.sessionStorage = sessionStorageMock;

// Mock the window.RAGChatbot namespace
global.window = {
  RAGChatbot: {
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
    }
  }
};

// Import the session manager
const SessionManager = require('../../../src/services/session-manager');

describe('SessionManager', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  describe('createSessionId', () => {
    test('should generate a valid UUID v4', () => {
      const sessionId = SessionManager.createSessionId();

      // Check that it matches UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(sessionId).toMatch(uuidRegex);
    });
  });

  describe('initializeSession', () => {
    test('should create a new session with provided ID', () => {
      const providedId = 'test-session-id-123';
      const session = SessionManager.initializeSession(providedId);

      expect(session.sessionId).toBe(providedId);
      expect(session.createdAt).toBeDefined();
      expect(session.conversationHistory).toEqual([]);
      expect(session.isActive).toBe(true);

      // Check that session is stored in sessionStorage
      const storedSession = JSON.parse(sessionStorage.getItem('rag-chat-session-id'));
      expect(storedSession.sessionId).toBe(providedId);
    });

    test('should create a new session with generated ID when no ID provided', () => {
      const session = SessionManager.initializeSession();

      expect(session.sessionId).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.conversationHistory).toEqual([]);
      expect(session.isActive).toBe(true);

      // Check that session is stored in sessionStorage
      const storedSession = JSON.parse(sessionStorage.getItem('rag-chat-session-id'));
      expect(storedSession.sessionId).toBe(session.sessionId);
    });
  });

  describe('getCurrentSession', () => {
    test('should return null when no session exists', () => {
      const session = SessionManager.getCurrentSession();
      expect(session).toBeNull();
    });

    test('should return the current session when one exists', () => {
      const testSession = {
        sessionId: 'test-session-123',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      sessionStorage.setItem('rag-chat-session-id', JSON.stringify(testSession));

      const session = SessionManager.getCurrentSession();
      expect(session).toEqual(testSession);
    });

    test('should return null when session data is malformed', () => {
      sessionStorage.setItem('rag-chat-session-id', 'invalid-json');

      const session = SessionManager.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('saveSession', () => {
    test('should save the session to sessionStorage', () => {
      const session = {
        sessionId: 'test-session-save',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      const storedSession = JSON.parse(sessionStorage.getItem('rag-chat-session-id'));
      expect(storedSession).toEqual(session);
    });

    test('should handle errors when saving session', () => {
      // Mock console.error to suppress the error in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to save an invalid session
      SessionManager.saveSession(null);

      expect(consoleSpy).toHaveBeenCalledWith('Invalid session object provided to saveSession');
      consoleSpy.mockRestore();
    });
  });

  describe('addMessage', () => {
    test('should add a message to the conversation history', () => {
      const session = {
        sessionId: 'test-session-add-message',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      const message = {
        id: 'test-message-1',
        sender: 'user',
        content: 'Test message content',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      SessionManager.addMessage(message);

      const updatedSession = SessionManager.getCurrentSession();
      expect(updatedSession.conversationHistory).toHaveLength(1);
      expect(updatedSession.conversationHistory[0]).toEqual(message);
    });

    test('should handle invalid message object', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to add an invalid message
      SessionManager.addMessage({});

      expect(consoleSpy).toHaveBeenCalledWith('Invalid message object provided to addMessage');
      consoleSpy.mockRestore();
    });

    test('should handle no active session', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const message = {
        id: 'test-message-1',
        sender: 'user',
        content: 'Test message content',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      SessionManager.addMessage(message);

      expect(consoleSpy).toHaveBeenCalledWith('No active session found');
      consoleSpy.mockRestore();
    });

    test('should limit conversation history size', () => {
      const session = {
        sessionId: 'test-session-limit',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      // Add more messages than the max limit
      const maxHistory = window.RAGChatbot.constants.MAX_HISTORY_MESSAGES;
      for (let i = 0; i < maxHistory + 10; i++) {
        const message = {
          id: `test-message-${i}`,
          sender: 'user',
          content: `Test message content ${i}`,
          timestamp: new Date().toISOString(),
          status: 'delivered'
        };

        SessionManager.addMessage(message);
      }

      const updatedSession = SessionManager.getCurrentSession();
      // Should keep around 80% of max size after trimming
      expect(updatedSession.conversationHistory.length).toBeLessThanOrEqual(maxHistory);
      expect(updatedSession.conversationHistory.length).toBeGreaterThan(maxHistory * 0.7);
    });

    test('should add default timestamp and status if not provided', () => {
      const session = {
        sessionId: 'test-session-defaults',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      const message = {
        id: 'test-message-defaults',
        sender: 'user',
        content: 'Test message content'
      };

      SessionManager.addMessage(message);

      const updatedSession = SessionManager.getCurrentSession();
      const addedMessage = updatedSession.conversationHistory[0];

      expect(addedMessage.timestamp).toBeDefined();
      expect(addedMessage.status).toBe('delivered'); // default status
    });
  });

  describe('getConversationHistory', () => {
    test('should return conversation history from current session', () => {
      const session = {
        sessionId: 'test-session-history',
        createdAt: new Date().toISOString(),
        conversationHistory: [
          { id: 'msg1', sender: 'user', content: 'Hello', timestamp: new Date().toISOString(), status: 'delivered' },
          { id: 'msg2', sender: 'agent', content: 'Hi there!', timestamp: new Date().toISOString(), status: 'delivered' }
        ],
        isActive: true
      };

      SessionManager.saveSession(session);

      const history = SessionManager.getConversationHistory();
      expect(history).toEqual(session.conversationHistory);
    });

    test('should return empty array when no session exists', () => {
      const history = SessionManager.getConversationHistory();
      expect(history).toEqual([]);
    });
  });

  describe('clearConversationHistory', () => {
    test('should clear the conversation history', () => {
      const session = {
        sessionId: 'test-session-clear',
        createdAt: new Date().toISOString(),
        conversationHistory: [
          { id: 'msg1', sender: 'user', content: 'Hello', timestamp: new Date().toISOString(), status: 'delivered' }
        ],
        isActive: true
      };

      SessionManager.saveSession(session);

      SessionManager.clearConversationHistory();

      const updatedSession = SessionManager.getCurrentSession();
      expect(updatedSession.conversationHistory).toEqual([]);
    });

    test('should handle no active session', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      SessionManager.clearConversationHistory();

      expect(consoleSpy).toHaveBeenCalledWith('No active session found');
      consoleSpy.mockRestore();
    });
  });

  describe('endSession', () => {
    test('should end the current session', () => {
      const session = {
        sessionId: 'test-session-end',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      SessionManager.endSession();

      const updatedSession = SessionManager.getCurrentSession();
      expect(updatedSession.isActive).toBe(false);
    });

    test('should handle no active session', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      SessionManager.endSession();

      expect(consoleSpy).toHaveBeenCalledWith('No active session to end');
      consoleSpy.mockRestore();
    });
  });

  describe('updateMessage', () => {
    test('should update a message in the conversation history', () => {
      const session = {
        sessionId: 'test-session-update',
        createdAt: new Date().toISOString(),
        conversationHistory: [
          { id: 'msg1', sender: 'user', content: 'Original content', timestamp: new Date().toISOString(), status: 'sent' },
          { id: 'msg2', sender: 'agent', content: 'Agent response', timestamp: new Date().toISOString(), status: 'delivered' }
        ],
        isActive: true
      };

      SessionManager.saveSession(session);

      const updates = { content: 'Updated content', status: 'delivered' };
      SessionManager.updateMessage('msg1', updates);

      const updatedSession = SessionManager.getCurrentSession();
      const updatedMessage = updatedSession.conversationHistory.find(m => m.id === 'msg1');
      expect(updatedMessage.content).toBe('Updated content');
      expect(updatedMessage.status).toBe('delivered');
    });

    test('should handle message not found', () => {
      const session = {
        sessionId: 'test-session-not-found',
        createdAt: new Date().toISOString(),
        conversationHistory: [
          { id: 'msg1', sender: 'user', content: 'Original content', timestamp: new Date().toISOString(), status: 'sent' }
        ],
        isActive: true
      };

      SessionManager.saveSession(session);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      SessionManager.updateMessage('non-existent-msg', { content: 'Updated content' });

      expect(consoleSpy).toHaveBeenCalledWith('Message not found in conversation history:', 'non-existent-msg');
      consoleSpy.mockRestore();
    });

    test('should handle no active session', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      SessionManager.updateMessage('msg1', { content: 'Updated content' });

      expect(consoleSpy).toHaveBeenCalledWith('No active session found');
      consoleSpy.mockRestore();
    });
  });

  describe('isSessionActive', () => {
    test('should return true when session exists and is active', () => {
      const session = {
        sessionId: 'test-session-active',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: true
      };

      SessionManager.saveSession(session);

      const isActive = SessionManager.isSessionActive();
      expect(isActive).toBe(true);
    });

    test('should return false when session exists but is not active', () => {
      const session = {
        sessionId: 'test-session-inactive',
        createdAt: new Date().toISOString(),
        conversationHistory: [],
        isActive: false
      };

      SessionManager.saveSession(session);

      const isActive = SessionManager.isSessionActive();
      expect(isActive).toBe(false);
    });

    test('should return false when no session exists', () => {
      const isActive = SessionManager.isSessionActive();
      expect(isActive).toBe(false);
    });
  });
});