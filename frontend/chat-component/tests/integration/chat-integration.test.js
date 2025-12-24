/**
 * Integration tests for the RAG Chatbot component
 * Testing the complete flow of question submission and response handling
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

// Setup a basic DOM environment
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

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock fetch API
global.fetch = jest.fn();

// Mock the RAGChatbot namespace with all required modules
global.window.RAGChatbot = {
  constants: require('../../src/utils/constants'),
  validators: require('../../src/utils/validators'),
  apiService: require('../../src/services/api-service'),
  sessionManager: require('../../src/services/session-manager'),
  textSelection: require('../../src/services/text-selection'),
  MessageBubble: require('../../src/components/MessageBubble'),
  InputArea: require('../../src/components/InputArea'),
  LoadingIndicator: require('../../src/components/LoadingIndicator'),
  ErrorDisplay: require('../../src/components/ErrorDisplay'),
  ChatInterface: require('../../src/components/ChatInterface')
};

// Import the main chat component
const ChatInterface = require('../../src/components/ChatInterface');

describe('Chat Integration Tests', () => {
  let container;
  let chatInterface;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset DOM
    container = document.getElementById('test-container');
    container.innerHTML = '<div id="chat-container"></div>';

    // Setup common mock returns
    window.RAGChatbot.validators.validateUrl.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateMessage.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateSessionId.mockReturnValue({ isValid: true });
    window.RAGChatbot.validators.validateApiResponse.mockReturnValue({ isValid: true });
  });

  describe('Complete Chat Flow', () => {
    test('should handle complete chat flow: text selection, question, and response', async () => {
      // Setup mock API response
      const mockApiResponse = {
        response: 'This is a comprehensive response based on your selected text and question',
        sources: [
          { id: 'source1', content: 'Relevant source information', similarity_score: 0.92 },
          { id: 'source2', content: 'Additional context source', similarity_score: 0.87 }
        ],
        query_id: 'comprehensive-query-id',
        response_id: 'comprehensive-response-id',
        confidence_score: 0.89
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Step 1: Simulate text selection
      const selectionDetails = {
        selectedText: 'This is important text from the robotics book that provides context',
        sourceUrl: 'http://test-book/chapter1',
        timestamp: new Date().toISOString()
      };

      chatInterface.handleTextSelection(selectionDetails);

      // Verify context indicator appears
      const contextIndicator = document.querySelector('.rag-context-indicator');
      expect(contextIndicator).toBeTruthy();
      expect(contextIndicator.textContent).toContain('This is important text from the robotics book');

      // Step 2: Type a question related to the selected text
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Can you explain how this concept works?';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Verify submit button is enabled
      const submitBtn = document.querySelector('#rag-chat-submit');
      expect(submitBtn.disabled).toBe(false);

      // Step 3: Submit the question with context
      await chatInterface.handleSendMessage();

      // Verify API call includes both question and context
      expect(fetch).toHaveBeenCalledWith(
        'http://test-backend/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'Can you explain how this concept works?',
            session_id: expect.any(String),
            context: {
              selected_text: 'This is important text from the robotics book that provides context',
              source_url: 'http://test-book/chapter1'
            }
          })
        })
      );

      // Verify both messages appear in the chat
      const messageBubbles = document.querySelectorAll('.rag-message-bubble');
      expect(messageBubbles.length).toBe(2); // User question + Agent response

      // Verify agent response contains expected content
      const agentMessage = document.querySelector('.rag-message-agent');
      expect(agentMessage).toBeTruthy();
      expect(agentMessage.textContent).toContain('This is a comprehensive response based on your selected text and question');

      // Verify sources are displayed
      const sourcesElements = document.querySelectorAll('.rag-message-sources');
      expect(sourcesElements.length).toBeGreaterThan(0);
    });

    test('should handle rapid consecutive questions', async () => {
      // Setup mock responses for multiple questions
      const responses = [
        { response: 'Response to first question', sources: [], query_id: 'q1', response_id: 'r1', confidence_score: 0.85 },
        { response: 'Response to second question', sources: [], query_id: 'q2', response_id: 'r2', confidence_score: 0.88 },
        { response: 'Response to third question', sources: [], query_id: 'q3', response_id: 'r3', confidence_score: 0.90 }
      ];

      let callIndex = 0;
      fetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses[callIndex++])
        });
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Send multiple questions rapidly
      const questions = [
        'First question',
        'Second question',
        'Third question'
      ];

      for (const question of questions) {
        const inputElement = document.querySelector('#rag-chat-input');
        inputElement.value = question;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));

        await chatInterface.handleSendMessage();
      }

      // Verify all API calls were made
      expect(fetch).toHaveBeenCalledTimes(3);

      // Verify all messages are displayed (3 user + 3 agent = 6)
      const messageBubbles = document.querySelectorAll('.rag-message-bubble');
      expect(messageBubbles.length).toBe(6);

      // Verify session history contains all messages
      const session = window.RAGChatbot.sessionManager.getCurrentSession();
      expect(session.conversationHistory.length).toBe(6);
    });

    test('should handle mixed success and error responses', async () => {
      // Setup mock responses - first succeeds, second fails, third succeeds
      const responseSequence = [
        // First call: success
        { ok: true, json: () => Promise.resolve({
          response: 'First response successful',
          sources: [],
          query_id: 'q1',
          response_id: 'r1',
          confidence_score: 0.85
        })},
        // Second call: error
        { ok: false, status: 500, json: () => Promise.resolve({ detail: 'Server error' }) },
        // Third call: success
        { ok: true, json: () => Promise.resolve({
          response: 'Third response successful',
          sources: [],
          query_id: 'q3',
          response_id: 'r3',
          confidence_score: 0.90
        })}
      ];

      let callCount = 0;
      fetch.mockImplementation(() => {
        return Promise.resolve(responseSequence[callCount++]);
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Send first question (should succeed)
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'First question';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      await chatInterface.handleSendMessage();

      // Send second question (should fail)
      inputElement.value = 'Second question';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      await chatInterface.handleSendMessage();

      // Send third question (should succeed)
      inputElement.value = 'Third question';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      await chatInterface.handleSendMessage();

      // Verify all 3 API calls were made
      expect(fetch).toHaveBeenCalledTimes(3);

      // Verify 5 messages total (3 user questions + 1 successful response + 1 error message)
      const messageBubbles = document.querySelectorAll('.rag-message-bubble, .rag-error-message');
      expect(messageBubbles.length).toBeGreaterThanOrEqual(4); // At least 3 user messages + 1 response/error

      // Verify that the session state is maintained despite error
      const session = window.RAGChatbot.sessionManager.getCurrentSession();
      expect(session).toBeTruthy();
      expect(session.isActive).toBe(true);
    });
  });

  describe('Session Management Integration', () => {
    test('should maintain conversation history across interactions', async () => {
      // Setup mock API response
      const mockApiResponse = {
        response: 'Response to test question',
        sources: [],
        query_id: 'test-query',
        response_id: 'test-response',
        confidence_score: 0.80
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Get the initial session
      const initialSession = window.RAGChatbot.sessionManager.getCurrentSession();
      expect(initialSession).toBeTruthy();
      expect(initialSession.sessionId).toBeTruthy();
      expect(initialSession.isActive).toBe(true);

      // Submit a question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Session test question';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      await chatInterface.handleSendMessage();

      // Verify session is still active
      const updatedSession = window.RAGChatbot.sessionManager.getCurrentSession();
      expect(updatedSession).toBeTruthy();
      expect(updatedSession.sessionId).toBe(initialSession.sessionId);
      expect(updatedSession.isActive).toBe(true);

      // Verify conversation history is maintained in session
      expect(updatedSession.conversationHistory.length).toBe(2); // User + Agent message
    });

    test('should handle session restoration from storage', () => {
      // Create a mock session in storage
      const mockSession = {
        sessionId: 'restored-session-123',
        createdAt: new Date().toISOString(),
        conversationHistory: [
          { id: 'msg1', sender: 'user', content: 'Previous message', timestamp: new Date().toISOString(), status: 'delivered' }
        ],
        isActive: true
      };

      sessionStorage.setItem('rag-chat-session-id', JSON.stringify(mockSession));

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Verify session was restored
      const restoredSession = window.RAGChatbot.sessionManager.getCurrentSession();
      expect(restoredSession.sessionId).toBe('restored-session-123');
      expect(restoredSession.conversationHistory.length).toBe(1);
      expect(restoredSession.conversationHistory[0].content).toBe('Previous message');
    });
  });

  describe('Text Selection Integration', () => {
    test('should handle text selection and context integration', () => {
      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Simulate text selection
      const selectionDetails = {
        selectedText: 'This is selected text from the book',
        sourceUrl: 'http://test-book/page1',
        timestamp: new Date().toISOString()
      };

      chatInterface.handleTextSelection(selectionDetails);

      // Verify selected text context was stored
      expect(chatInterface.selectedTextContext).toEqual(selectionDetails);

      // Verify context indicator is shown
      const contextIndicator = document.querySelector('.rag-context-indicator');
      expect(contextIndicator).toBeTruthy();
      expect(contextIndicator.textContent).toContain('This is selected text from the book');
    });

    test('should prepare context for API using text selection service', () => {
      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Mock the text selection service
      window.RAGChatbot.textSelection.prepareContextForApi = jest.fn().mockReturnValue({
        selected_text: 'Selected text for API',
        source_url: 'http://test-book/page1',
        timestamp: new Date().toISOString(),
        container_id: 'test-container',
        container_class: 'test-class'
      });

      // Simulate text selection
      const selectionDetails = {
        selectedText: 'Selected text for API',
        sourceUrl: 'http://test-book/page1',
        timestamp: new Date().toISOString(),
        containerId: 'test-container',
        containerClass: 'test-class'
      };

      chatInterface.handleTextSelection(selectionDetails);

      // Verify the text selection service was called
      expect(window.RAGChatbot.textSelection.prepareContextForApi).toHaveBeenCalledWith(selectionDetails);

      // Verify the prepared context is stored
      expect(chatInterface.selectedTextContext).toEqual({
        selected_text: 'Selected text for API',
        source_url: 'http://test-book/page1',
        timestamp: new Date().toISOString(),
        container_id: 'test-container',
        container_class: 'test-class'
      });
    });
  });

  describe('Component Interaction', () => {
    test('should integrate InputArea and MessageBubble components properly', () => {
      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Verify InputArea was created and is functional
      const inputElement = document.querySelector('#rag-chat-input');
      expect(inputElement).toBeTruthy();
      expect(inputElement.classList.contains('rag-chat-input')).toBe(true);

      // Verify submit button exists
      const submitBtn = document.querySelector('#rag-chat-submit');
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.classList.contains('rag-chat-submit-btn')).toBe(true);

      // Verify messages container exists
      const messagesContainer = document.querySelector('#rag-chat-messages');
      expect(messagesContainer).toBeTruthy();
      expect(messagesContainer.classList.contains('rag-chat-messages')).toBe(true);
    });

    test('should handle message display through MessageBubble component', () => {
      // Mock MessageBubble.create to return a simple element
      window.RAGChatbot.MessageBubble.create = jest.fn((message) => {
        const element = document.createElement('div');
        element.className = `rag-message-bubble rag-message-${message.sender}`;
        element.dataset.messageId = message.id;
        element.innerHTML = `<div class="rag-message-content">${message.content}</div>`;
        return element;
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Create a test message
      const testMessage = {
        id: 'test-message-123',
        sender: 'agent',
        content: 'Test message for display',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      // Display the message
      chatInterface.displayMessage(testMessage);

      // Verify MessageBubble.create was called
      expect(window.RAGChatbot.MessageBubble.create).toHaveBeenCalledWith(testMessage);

      // Verify message was displayed
      const displayedMessage = document.querySelector('[data-message-id="test-message-123"]');
      expect(displayedMessage).toBeTruthy();
      expect(displayedMessage.textContent).toContain('Test message for display');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API errors gracefully', async () => {
      // Setup fetch to return error
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ detail: 'Server error occurred' })
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Simulate user typing a question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Question that causes error';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit the question
      await chatInterface.handleSendMessage();

      // Verify error message is displayed
      const errorElements = document.querySelectorAll('.rag-error-message');
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].textContent).toContain('Server error occurred');
    });

    test('should handle network errors', async () => {
      // Setup fetch to throw network error
      fetch.mockRejectedValue(new Error('Network error'));

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Simulate user typing a question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Question that causes network error';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit the question
      await chatInterface.handleSendMessage();

      // Verify error message is displayed
      const errorElements = document.querySelectorAll('.rag-error-message');
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].textContent).toContain('Network error');
    });

    test('should handle validation errors', async () => {
      // Setup validation to fail
      window.RAGChatbot.validators.validateMessage.mockReturnValue({
        isValid: false,
        error: 'Message too long'
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Simulate user typing a question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Very long message that exceeds validation';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit the question
      await chatInterface.handleSendMessage();

      // Verify error message is displayed
      const errorElements = document.querySelectorAll('.rag-error-message');
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].textContent).toContain('Message too long');
    });
  });

  describe('Loading Indicator Integration', () => {
    test('should show and hide loading indicator during API calls', async () => {
      // Setup mock API response with a delay to allow us to observe loading state
      fetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                response: 'Delayed response after simulated API call',
                sources: [],
                query_id: 'delayed-query',
                response_id: 'delayed-response',
                confidence_score: 0.85
              })
            });
          }, 100); // Small delay to observe loading state
        });
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Simulate user typing a question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Question with loading indicator';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit the question
      const sendMessagePromise = chatInterface.handleSendMessage();

      // Check that loading indicator is shown
      const loadingIndicator = document.querySelector('.rag-loading-indicator');
      expect(loadingIndicator).toBeTruthy();

      // Wait for the promise to resolve
      await sendMessagePromise;

      // Check that loading indicator is removed after response
      const loadingIndicatorAfter = document.querySelector('.rag-loading-indicator');
      expect(loadingIndicatorAfter).toBeNull();

      // Verify response message is displayed
      const agentMessage = document.querySelector('.rag-message-agent');
      expect(agentMessage).toBeTruthy();
      expect(agentMessage.textContent).toContain('Delayed response after simulated API call');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle very long user input', async () => {
      // Create very long input (over 1000 characters)
      const longInput = 'A'.repeat(1500);

      // Setup mock API response
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          response: 'Thank you for your detailed question',
          sources: [],
          query_id: 'long-query-id',
          response_id: 'long-response-id',
          confidence_score: 0.82
        })
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Set long input value
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = longInput;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Attempt to submit
      await chatInterface.handleSendMessage();

      // Verify API was called with the long input
      expect(fetch).toHaveBeenCalledWith(
        'http://test-backend/api/chat',
        expect.objectContaining({
          body: expect.stringContaining(longInput.substring(0, 100)) // Check that input was included (first 100 chars)
        })
      );
    });

    test('should maintain responsiveness during API calls', async () => {
      // Mock API to simulate slow response
      fetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                response: 'Delayed response after simulated slow API',
                sources: [],
                query_id: 'slow-query-id',
                response_id: 'slow-response-id',
                confidence_score: 0.78
              })
            });
          }, 2000); // 2 second delay
        });
      });

      // Create chat interface
      chatInterface = new ChatInterface('chat-container', {
        backendUrl: 'http://test-backend/api/chat'
      });

      // Start time measurement
      const startTime = Date.now();

      // Type and submit question
      const inputElement = document.querySelector('#rag-chat-input');
      inputElement.value = 'Question for slow API test';
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));

      // Submit the question (this will take ~2 seconds)
      const submitPromise = chatInterface.handleSendMessage();

      // Check that UI remains responsive during the delay
      // The UI should show loading indicator but not freeze
      const loadingIndicator = document.querySelector('.rag-loading-indicator');
      expect(loadingIndicator).toBeTruthy();

      // Wait for the API call to complete
      await submitPromise;

      // Verify response was received after delay
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000); // Should take at least 2 seconds

      // Verify response message was displayed
      const agentMessage = document.querySelector('.rag-message-agent');
      expect(agentMessage).toBeTruthy();
      expect(agentMessage.textContent).toContain('Delayed response after simulated slow API');
    });
  });
});