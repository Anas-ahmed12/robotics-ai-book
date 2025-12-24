// API service for the RAG Chatbot component

const ApiService = {
  /**
   * Sends a query to the backend API
   * @param {string} query - The user's question
   * @param {string} sessionId - The current session ID
   * @param {object} context - Additional context (e.g., selected text)
   * @param {string} backendUrl - The backend API URL
   * @returns {Promise} - Promise that resolves to the API response
   */
  sendQuery: async function(query, sessionId, context = null, backendUrl) {
    // Validate inputs
    const messageValidation = window.RAGChatbot?.validators?.validateMessage(query);
    if (!messageValidation?.isValid) {
      throw new Error(messageValidation?.error || 'Invalid message');
    }

    if (context?.selected_text) {
      const selectedTextValidation = window.RAGChatbot?.validators?.validateSelectedText(context.selected_text);
      if (!selectedTextValidation?.isValid) {
        throw new Error(selectedTextValidation?.error || 'Invalid selected text');
      }
    }

    const sessionIdValidation = window.RAGChatbot?.validators?.validateSessionId(sessionId);
    if (!sessionIdValidation?.isValid) {
      throw new Error(sessionIdValidation?.error || 'Invalid session ID');
    }

    const urlValidation = window.RAGChatbot?.validators?.validateUrl(backendUrl);
    if (!urlValidation?.isValid) {
      throw new Error('Invalid backend URL');
    }

    // Prepare request payload
    const requestBody = {
      query: query,
      session_id: sessionId
    };

    if (context && Object.keys(context).length > 0) {
      requestBody.context = context;
    }

    // Set up the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), window.RAGChatbot?.constants?.API_TIMEOUT || 30000);

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Try to get error details from response body
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate the response
      const responseValidation = window.RAGChatbot?.validators?.validateApiResponse(data);
      if (!responseValidation?.isValid) {
        throw new Error(responseValidation?.error || 'Invalid API response format');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(window.RAGChatbot?.constants?.DEFAULT_MESSAGES?.TIMEOUT_MESSAGE || 'Request timed out');
      }

      throw error;
    }
  },

  /**
   * Tests the backend connection
   * @param {string} backendUrl - The backend API URL to test
   * @returns {Promise<boolean>} - Promise that resolves to connection status
   */
  testConnection: async function(backendUrl) {
    try {
      // Validate backend URL
      const urlValidation = window.RAGChatbot?.validators?.validateUrl(backendUrl);
      if (!urlValidation?.isValid) {
        console.error('Invalid backend URL for connection test:', backendUrl);
        return false;
      }

      // Make a simple request to test connectivity
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test connection',
          session_id: 'test-session'
        })
      });

      // If we get any response (even an error response), the connection is working
      return response.status !== 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  /**
   * Counts tokens in a text using the backend API
   * @param {string} text - Text to count tokens for
   * @param {string} backendUrl - The backend API URL
   * @returns {Promise<number>} - Promise that resolves to token count
   */
  countTokens: async function(text, backendUrl) {
    try {
      const urlValidation = window.RAGChatbot?.validators?.validateUrl(backendUrl);
      if (!urlValidation?.isValid) {
        throw new Error('Invalid backend URL');
      }

      if (!text || typeof text !== 'string') {
        throw new Error('Text is required and must be a string');
      }

      const response = await fetch(`${backendUrl}/token_count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        throw new Error(`Token count request failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.token_count !== 'number') {
        throw new Error('Invalid response format for token count');
      }

      return data.token_count;
    } catch (error) {
      console.error('Token count failed:', error);
      throw error;
    }
  },

  /**
   * Sends a heartbeat request to keep the session alive
   * @param {string} sessionId - The current session ID
   * @param {string} backendUrl - The backend API URL
   * @returns {Promise<boolean>} - Promise that resolves to heartbeat success status
   */
  sendHeartbeat: async function(sessionId, backendUrl) {
    try {
      const urlValidation = window.RAGChatbot?.validators?.validateUrl(backendUrl);
      if (!urlValidation?.isValid) {
        throw new Error('Invalid backend URL');
      }

      const sessionIdValidation = window.RAGChatbot?.validators?.validateSessionId(sessionId);
      if (!sessionIdValidation?.isValid) {
        throw new Error('Invalid session ID');
      }

      const response = await fetch(`${backendUrl}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId })
      });

      return response.ok;
    } catch (error) {
      console.error('Heartbeat request failed:', error);
      return false;
    }
  }
};

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.apiService = ApiService;
}