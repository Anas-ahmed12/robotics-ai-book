// Validation utilities for the RAG Chatbot component

const Validators = {
  /**
   * Validates a user message
   * @param {string} message - The message to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateMessage: function(message) {
    if (!message || typeof message !== 'string') {
      return {
        isValid: false,
        error: 'Message is required and must be a string'
      };
    }

    if (message.trim().length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty'
      };
    }

    if (message.length > (window.RAGChatbot?.constants?.MAX_MESSAGE_LENGTH || 2000)) {
      return {
        isValid: false,
        error: `Message exceeds maximum length of ${window.RAGChatbot?.constants?.MAX_MESSAGE_LENGTH || 2000} characters`
      };
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates selected text from the book
   * @param {string} selectedText - The selected text to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateSelectedText: function(selectedText) {
    if (!selectedText || typeof selectedText !== 'string') {
      return {
        isValid: false,
        error: 'Selected text is required and must be a string'
      };
    }

    if (selectedText.trim().length === 0) {
      return {
        isValid: false,
        error: 'Selected text cannot be empty'
      };
    }

    if (selectedText.length > (window.RAGChatbot?.constants?.MAX_SELECTED_TEXT_LENGTH || 1000)) {
      return {
        isValid: false,
        error: `Selected text exceeds maximum length of ${window.RAGChatbot?.constants?.MAX_SELECTED_TEXT_LENGTH || 1000} characters`
      };
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates a session ID
   * @param {string} sessionId - The session ID to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateSessionId: function(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        isValid: false,
        error: 'Session ID is required and must be a string'
      };
    }

    // Basic validation for UUID format (optional)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(sessionId)) {
      // If not UUID format, allow alphanumeric with hyphens and underscores
      const alphanumericRegex = /^[a-zA-Z0-9-_]+$/;
      if (!alphanumericRegex.test(sessionId)) {
        return {
          isValid: false,
          error: 'Session ID format is invalid'
        };
      }
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates a URL
   * @param {string} url - The URL to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL is required and must be a string'
      };
    }

    try {
      new URL(url);
      return {
        isValid: true,
        error: null
      };
    } catch (e) {
      return {
        isValid: false,
        error: 'URL format is invalid'
      };
    }
  },

  /**
   * Validates an API response
   * @param {object} response - The API response to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateApiResponse: function(response) {
    if (!response || typeof response !== 'object') {
      return {
        isValid: false,
        error: 'Response is required and must be an object'
      };
    }

    if (!response.hasOwnProperty('response')) {
      return {
        isValid: false,
        error: 'Response object must contain "response" property'
      };
    }

    if (typeof response.response !== 'string') {
      return {
        isValid: false,
        error: 'Response property must be a string'
      };
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates a message object for the chat interface
   * @param {object} message - The message object to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateMessageObject: function(message) {
    if (!message || typeof message !== 'object') {
      return {
        isValid: false,
        error: 'Message must be an object'
      };
    }

    if (!message.hasOwnProperty('id') || typeof message.id !== 'string') {
      return {
        isValid: false,
        error: 'Message must have an id property of type string'
      };
    }

    if (!message.hasOwnProperty('sender') || typeof message.sender !== 'string') {
      return {
        isValid: false,
        error: 'Message must have a sender property of type string'
      };
    }

    if (!message.hasOwnProperty('content') || typeof message.content !== 'string') {
      return {
        isValid: false,
        error: 'Message must have a content property of type string'
      };
    }

    if (!message.hasOwnProperty('timestamp') || typeof message.timestamp !== 'string') {
      return {
        isValid: false,
        error: 'Message must have a timestamp property of type string'
      };
    }

    if (!message.hasOwnProperty('status') || typeof message.status !== 'string') {
      return {
        isValid: false,
        error: 'Message must have a status property of type string'
      };
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates a conversation history array
   * @param {array} history - The conversation history to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateConversationHistory: function(history) {
    if (!history || !Array.isArray(history)) {
      return {
        isValid: false,
        error: 'Conversation history must be an array'
      };
    }

    for (let i = 0; i < history.length; i++) {
      const messageValidation = this.validateMessageObject(history[i]);
      if (!messageValidation.isValid) {
        return {
          isValid: false,
          error: `Message at index ${i} is invalid: ${messageValidation.error}`
        };
      }
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Validates text selection context
   * @param {object} context - The text selection context to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateTextSelectionContext: function(context) {
    if (!context || typeof context !== 'object') {
      return {
        isValid: false,
        error: 'Context must be an object'
      };
    }

    if (!context.selectedText || typeof context.selectedText !== 'string') {
      return {
        isValid: false,
        error: 'Context must have a selectedText property of type string'
      };
    }

    if (context.selectedText.length > (window.RAGChatbot?.constants?.TEXT_SELECTION_CONFIG?.MAX_SELECTION_LENGTH || 1000)) {
      return {
        isValid: false,
        error: `Selected text exceeds maximum length of ${window.RAGChatbot?.constants?.TEXT_SELECTION_CONFIG?.MAX_SELECTION_LENGTH || 1000} characters`
      };
    }

    if (context.sourceUrl && typeof context.sourceUrl !== 'string') {
      return {
        isValid: false,
        error: 'Context sourceUrl property must be a string if provided'
      };
    }

    if (context.timestamp && typeof context.timestamp !== 'string') {
      return {
        isValid: false,
        error: 'Context timestamp property must be a string if provided'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }
};

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.validators = Validators;
}