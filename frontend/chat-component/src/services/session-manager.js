// Session management service for the RAG Chatbot component

const SessionManager = {
  /**
   * Creates a new session ID using UUID v4
   * @returns {string} - New session ID
   */
  createSessionId: function() {
    // Generate a UUID v4 format session ID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Initializes a new session with the given ID or generates a new one
   * @param {string} sessionId - Optional session ID to use
   * @returns {object} - Session object with ID, creation time, and initial state
   */
  initializeSession: function(sessionId = null) {
    const actualSessionId = sessionId || this.createSessionId();

    const session = {
      sessionId: actualSessionId,
      createdAt: new Date().toISOString(),
      conversationHistory: [],
      isActive: true
    };

    // Store the session in sessionStorage
    this.saveSession(session);

    return session;
  },

  /**
   * Gets the current session from sessionStorage
   * @returns {object|null} - Current session object or null if not found
   */
  getCurrentSession: function() {
    try {
      const sessionData = sessionStorage.getItem(
        window.RAGChatbot?.constants?.SESSION_STORAGE_KEYS?.CONVERSATION_HISTORY || 'rag-chat-session-id'
      );

      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error retrieving session from storage:', error);
      return null;
    }
  },

  /**
   * Saves the session to sessionStorage
   * @param {object} session - Session object to save
   */
  saveSession: function(session) {
    if (!session || !session.sessionId) {
      console.error('Invalid session object provided to saveSession');
      return;
    }

    try {
      sessionStorage.setItem(
        window.RAGChatbot?.constants?.SESSION_STORAGE_KEYS?.CONVERSATION_HISTORY || 'rag-chat-session-id',
        JSON.stringify(session)
      );
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  },

  /**
   * Adds a message to the conversation history
   * @param {object} message - Message object to add to history
   * @returns {boolean} - True if successful, false otherwise
   */
  addMessage: function(message) {
    const session = this.getCurrentSession();

    if (!session) {
      console.error('No active session found');
      return false;
    }

    // Validate message object
    const messageValidation = window.RAGChatbot?.validators?.validateMessageObject(message);
    if (!messageValidation?.isValid) {
      console.error('Invalid message object provided to addMessage:', messageValidation?.error);
      return false;
    }

    // Limit conversation history size to prevent storage issues
    const maxHistory = window.RAGChatbot?.constants?.MAX_HISTORY_MESSAGES || 100;
    if (session.conversationHistory.length >= maxHistory) {
      // Remove oldest messages to maintain max size (keep most recent 80%)
      const keepCount = Math.floor(maxHistory * 0.8);
      session.conversationHistory = session.conversationHistory.slice(-keepCount);
    }

    // Add the new message
    session.conversationHistory.push(message);

    // Save updated session
    this.saveSession(session);

    return true;
  },

  /**
   * Updates a message in the conversation history
   * @param {string} messageId - ID of the message to update
   * @param {object} updates - Object containing properties to update
   * @returns {boolean} - True if successful, false otherwise
   */
  updateMessage: function(messageId, updates) {
    const session = this.getCurrentSession();

    if (!session) {
      console.error('No active session found');
      return false;
    }

    const messageIndex = session.conversationHistory.findIndex(msg => msg.id === messageId);

    if (messageIndex === -1) {
      console.warn('Message not found in conversation history:', messageId);
      return false;
    }

    // Update the message with new properties
    session.conversationHistory[messageIndex] = {
      ...session.conversationHistory[messageIndex],
      ...updates
    };

    // Save updated session
    this.saveSession(session);

    return true;
  },

  /**
   * Gets the conversation history from the current session
   * @returns {array} - Array of messages in the conversation history
   */
  getConversationHistory: function() {
    const session = this.getCurrentSession();
    return session ? session.conversationHistory : [];
  },

  /**
   * Clears the conversation history
   */
  clearConversationHistory: function() {
    const session = this.getCurrentSession();

    if (!session) {
      console.error('No active session found');
      return;
    }

    session.conversationHistory = [];
    this.saveSession(session);
  },

  /**
   * Ends the current session
   */
  endSession: function() {
    const session = this.getCurrentSession();

    if (!session) {
      console.error('No active session to end');
      return;
    }

    session.isActive = false;
    this.saveSession(session);
  },

  /**
   * Checks if there is an active session
   * @returns {boolean} - True if there's an active session, false otherwise
   */
  isSessionActive: function() {
    const session = this.getCurrentSession();
    return session ? session.isActive : false;
  },

  /**
   * Gets the current session ID
   * @returns {string|null} - Current session ID or null if no session
   */
  getSessionId: function() {
    const session = this.getCurrentSession();
    return session ? session.sessionId : null;
  },

  /**
   * Adds multiple messages to the conversation history
   * @param {array} messages - Array of message objects to add
   * @returns {boolean} - True if successful, false otherwise
   */
  addMessages: function(messages) {
    if (!Array.isArray(messages)) {
      console.error('Messages must be an array');
      return false;
    }

    const session = this.getCurrentSession();

    if (!session) {
      console.error('No active session found');
      return false;
    }

    // Validate all messages first
    for (const message of messages) {
      const messageValidation = window.RAGChatbot?.validators?.validateMessageObject(message);
      if (!messageValidation?.isValid) {
        console.error('Invalid message in batch:', messageValidation?.error);
        return false;
      }
    }

    // Add messages to history
    for (const message of messages) {
      // Limit history size before adding each message
      const maxHistory = window.RAGChatbot?.constants?.MAX_HISTORY_MESSAGES || 100;
      if (session.conversationHistory.length >= maxHistory) {
        const keepCount = Math.floor(maxHistory * 0.8);
        session.conversationHistory = session.conversationHistory.slice(-keepCount);
      }

      session.conversationHistory.push(message);
    }

    // Save updated session
    this.saveSession(session);

    return true;
  },

  /**
   * Updates session metadata
   * @param {object} metadataUpdates - Object containing metadata properties to update
   * @returns {boolean} - True if successful, false otherwise
   */
  updateSessionMetadata: function(metadataUpdates) {
    const session = this.getCurrentSession();

    if (!session || typeof metadataUpdates !== 'object') {
      console.error('Invalid session or metadata updates');
      return false;
    }

    // Add metadata properties to session
    Object.assign(session, metadataUpdates);

    // Save updated session
    this.saveSession(session);

    return true;
  },

  /**
   * Expires old sessions based on a timeout
   * @param {number} timeoutMinutes - Number of minutes after which sessions expire
   * @returns {boolean} - True if successful, false otherwise
   */
  cleanupExpiredSessions: function(timeoutMinutes = 30) {
    const session = this.getCurrentSession();

    if (!session) {
      // No session to clean up
      return true;
    }

    try {
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const minutesElapsed = (now - createdAt) / (1000 * 60);

      if (minutesElapsed > timeoutMinutes) {
        // Session has expired, end it
        session.isActive = false;
        this.saveSession(session);
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error checking session expiration:', error);
      return false;
    }
  }
};

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.sessionManager = SessionManager;
}