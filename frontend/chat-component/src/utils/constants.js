// Constants for the RAG Chatbot component

const CONSTANTS = {
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_MESSAGE_LENGTH: 2000,
  MAX_SELECTED_TEXT_LENGTH: 1000,
  MAX_HISTORY_MESSAGES: 100,

  // UI Configuration
  CHAT_CONTAINER_ID: 'rag-chat-main-container',
  CHAT_THEME_BLUE_WHITE: 'blue-white',
  CHAT_THEME_DARK: 'dark-mode',

  // Message Status
  MESSAGE_STATUS: {
    SENT: 'sent',
    PENDING: 'pending',
    DELIVERED: 'delivered',
    ERROR: 'error'
  },

  // Sender Types
  SENDER_TYPES: {
    USER: 'user',
    AGENT: 'agent'
  },

  // Session Storage Keys
  SESSION_STORAGE_KEYS: {
    CONVERSATION_HISTORY: 'rag-chat-conversation-history',
    SESSION_ID: 'rag-chat-session-id',
    TIMESTAMP: 'rag-chat-timestamp'
  },

  // Event Types
  EVENT_TYPES: {
    MESSAGE_SENT: 'messageSent',
    MESSAGE_RECEIVED: 'messageReceived',
    SESSION_STARTED: 'sessionStarted',
    SESSION_ENDED: 'sessionEnded'
  },

  // Default Messages
  DEFAULT_MESSAGES: {
    ERROR_MESSAGE: 'Sorry, I encountered an error processing your request. Please try again.',
    TIMEOUT_MESSAGE: 'Request timed out. Please try again.',
    WELCOME_MESSAGE: 'Hello! I\'m your AI assistant for the Robotics-AI Book. Ask me anything.'
  },

  // Text Selection
  TEXT_SELECTION_CONFIG: {
    MIN_SELECTION_LENGTH: 3,
    MAX_SELECTION_LENGTH: 1000,
    CONTEXT_PREVIEW_LENGTH: 100
  },

  // Performance
  DEBOUNCE_DELAY: 300, // ms for text selection debouncing
  SCROLL_TO_BOTTOM_DELAY: 100, // ms delay for scrolling to bottom

  // Styling
  CSS_CLASSES: {
    CHAT_CONTAINER: 'rag-chat-container',
    MESSAGE_BUBBLE: 'rag-message-bubble',
    MESSAGE_USER: 'rag-message-user',
    MESSAGE_AGENT: 'rag-message-agent',
    MESSAGE_PENDING: 'rag-message-pending',
    MESSAGE_ERROR: 'rag-message-error',
    INPUT_AREA: 'rag-chat-input',
    SUBMIT_BUTTON: 'rag-chat-submit-btn',
    MESSAGES_CONTAINER: 'rag-chat-messages',
    HEADER: 'rag-chat-header',
    INPUT_CONTAINER: 'rag-chat-input-container',
    LOADING_INDICATOR: 'rag-loading-indicator',
    ERROR_DISPLAY: 'rag-error-message'
  }
};

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.constants = CONSTANTS;
}