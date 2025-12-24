/**
 * Unit tests for the API service
 */

// Mock the global fetch API
global.fetch = jest.fn();

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
    },
    validators: {
      validateMessage: jest.fn(),
      validateSelectedText: jest.fn(),
      validateSessionId: jest.fn(),
      validateApiResponse: jest.fn(),
      validateUrl: jest.fn()
    }
  }
};

// Import the api service
const ApiService = require('../../../src/services/api-service');

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendQuery', () => {
    test('should send a query to the backend API successfully', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateApiResponse.mockReturnValue({ isValid: true });

      // Setup mock fetch response
      const mockResponse = {
        response: 'This is a test response',
        sources: [],
        query_id: 'test-query-id',
        response_id: 'test-response-id',
        confidence_score: 0.95
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Call the function
      const result = await ApiService.sendQuery(
        'Test question',
        'test-session-id',
        null,
        'http://test-backend/api/chat'
      );

      // Verify the result
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'Test question',
            session_id: 'test-session-id'
          })
        })
      );
    });

    test('should send a query with context successfully', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateApiResponse.mockReturnValue({ isValid: true });

      // Setup mock fetch response
      const mockResponse = {
        response: 'This is a test response with context',
        sources: [],
        query_id: 'test-query-id',
        response_id: 'test-response-id',
        confidence_score: 0.92
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Call the function with context
      const context = {
        selected_text: 'This is selected text',
        source_url: 'http://test-book/page1'
      };

      const result = await ApiService.sendQuery(
        'Test question with context',
        'test-session-id',
        context,
        'http://test-backend/api/chat'
      );

      // Verify the result
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'Test question with context',
            session_id: 'test-session-id',
            context: context
          })
        })
      );
    });

    test('should handle validation errors for invalid message', async () => {
      // Setup mock validation to return invalid
      window.RAGChatbot.validators.validateMessage.mockReturnValue({
        isValid: false,
        error: 'Invalid message'
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Invalid message',
        'test-session-id',
        null,
        'http://test-backend/api/chat'
      )).rejects.toThrow('Invalid message');
    });

    test('should handle validation errors for invalid session ID', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({
        isValid: false,
        error: 'Invalid session ID'
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Valid message',
        'invalid-session-id',
        null,
        'http://test-backend/api/chat'
      )).rejects.toThrow('Invalid session ID');
    });

    test('should handle validation errors for invalid URL', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid URL'
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Valid message',
        'valid-session-id',
        null,
        'invalid-url'
      )).rejects.toThrow('Invalid backend URL');
    });

    test('should handle HTTP errors from the API', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });

      // Setup mock fetch to return an error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error' })
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Test question',
        'test-session-id',
        null,
        'http://test-backend/api/chat'
      )).rejects.toThrow('Server error');
    });

    test('should handle timeout errors', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });

      // Mock fetch to simulate a timeout
      global.fetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Test question',
        'test-session-id',
        null,
        'http://test-backend/api/chat'
      )).rejects.toThrow(window.RAGChatbot.constants.DEFAULT_MESSAGES.TIMEOUT_MESSAGE);
    });

    test('should handle invalid API response format', async () => {
      // Setup mock validation functions
      window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });
      window.RAGChatbot.validators.validateApiResponse.mockReturnValue({
        isValid: false,
        error: 'Invalid API response format'
      });

      // Setup mock fetch response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      // Call the function
      await expect(ApiService.sendQuery(
        'Test question',
        'test-session-id',
        null,
        'http://test-backend/api/chat'
      )).rejects.toThrow('Invalid API response format');
    });
  });

  describe('testConnection', () => {
    test('should return true for successful connection test', async () => {
      // Setup mock validation
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });

      // Setup mock fetch response
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      // Call the function
      const result = await ApiService.testConnection('http://test-backend/api/chat');

      // Verify the result
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'test connection',
            session_id: 'test-session'
          })
        })
      );
    });

    test('should return false for invalid URL', async () => {
      // Setup mock validation
      window.RAGChatbot.validators.validateUrl.mockReturnValue({
        isValid: false,
        error: 'Invalid URL'
      });

      // Call the function
      const result = await ApiService.testConnection('invalid-url');

      // Verify the result
      expect(result).toBe(false);
    });

    test('should return false when fetch throws an error', async () => {
      // Setup mock validation
      window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });

      // Setup mock fetch to throw an error
      global.fetch.mockRejectedValue(new Error('Network error'));

      // Call the function
      const result = await ApiService.testConnection('http://test-backend/api/chat');

      // Verify the result
      expect(result).toBe(false);
    });
  });
});