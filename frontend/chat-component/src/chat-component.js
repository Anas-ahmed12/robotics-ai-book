// Main integration file for the RAG Chatbot component

// Ensure the RAGChatbot namespace exists
window.RAGChatbot = window.RAGChatbot || {};

/**
 * Initialize the RAG Chatbot component
 * @param {object} options - Configuration options for the chatbot
 * @param {string} options.containerId - ID of the container element for the chat
 * @param {string} options.backendUrl - URL of the backend API
 * @param {string} options.theme - Theme for the chat interface
 * @param {number} options.maxHistory - Maximum number of messages to keep in history
 * @param {boolean} options.enableTextSelection - Whether to enable text selection
 * @param {boolean} options.defaultOpen - Whether the chat should be open by default
 */
RAGChatbot.init = function(options = {}) {
  // Validate required options
  if (!options.containerId) {
    console.error('RAGChatbot: containerId is required');
    return null;
  }

  // Validate backend URL if provided
  if (options.backendUrl) {
    const urlValidation = window.RAGChatbot?.validators?.validateUrl(options.backendUrl);
    if (!urlValidation?.isValid) {
      console.error('RAGChatbot:', urlValidation?.error || 'Invalid backend URL');
      return null;
    }
  }

  // Create the chat interface instance
  try {
    const chatInterface = new window.RAGChatbot.ChatInterface(options.containerId, {
      backendUrl: options.backendUrl,
      theme: options.theme,
      maxHistory: options.maxHistory,
      enableTextSelection: options.enableTextSelection,
      defaultOpen: options.defaultOpen
    });

    // Store the instance for potential future use
    window.RAGChatbot.instance = chatInterface;

    // Return the instance
    return chatInterface;
  } catch (error) {
    console.error('RAGChatbot initialization failed:', error);
    return null;
  }
};

/**
 * Preloads frequently used assets to optimize performance
 */
RAGChatbot.preloadAssets = function() {
  // Preload any frequently used assets like fonts, icons, or common images
  // This is a placeholder for future asset preloading functionality
  // In a real implementation, this could preload CSS, fonts, or other assets
  console.log('RAGChatbot: Preloading assets for optimal performance');
};

/**
 * Lazy loads the RAG Chatbot component only when needed
 * @param {object} options - Configuration options for the chatbot
 * @param {string} options.containerId - ID of the container element for the chat
 * @param {string} options.triggerSelector - CSS selector that triggers the chat loading (e.g., button ID)
 * @param {string} options.backendUrl - URL of the backend API
 */
RAGChatbot.lazyInit = function(options = {}) {
  if (!options.containerId || !options.triggerSelector) {
    console.error('RAGChatbot.lazyInit: containerId and triggerSelector are required');
    return;
  }

  const triggerElement = document.querySelector(options.triggerSelector);
  if (!triggerElement) {
    console.error(`RAGChatbot.lazyInit: Element with selector "${options.triggerSelector}" not found`);
    return;
  }

  // Attach event listener to trigger element
  triggerElement.addEventListener('click', function loadChat() {
    // Remove the event listener to prevent multiple initializations
    triggerElement.removeEventListener('click', loadChat);

    // Initialize the chat component
    RAGChatbot.init({
      containerId: options.containerId,
      backendUrl: options.backendUrl,
      theme: options.theme,
      maxHistory: options.maxHistory,
      enableTextSelection: options.enableTextSelection,
      defaultOpen: options.defaultOpen
    });
  });
};

/**
 * Dynamically imports and initializes the RAG Chatbot component
 * @param {object} options - Configuration options for the chatbot
 * @param {string} options.containerId - ID of the container element for the chat
 * @param {string} options.backendUrl - URL of the backend API
 * @param {function} callback - Optional callback function to execute after initialization
 */
RAGChatbot.dynamicInit = async function(options = {}, callback) {
  // Performance optimization: Only load the component when actually needed
  if (!options.containerId) {
    console.error('RAGChatbot.dynamicInit: containerId is required');
    return null;
  }

  try {
    // In a real implementation, this would dynamically import components
    // For now, we'll just initialize normally
    const chatInstance = RAGChatbot.init(options);

    if (callback && typeof callback === 'function') {
      callback(chatInstance);
    }

    return chatInstance;
  } catch (error) {
    console.error('RAGChatbot dynamic initialization failed:', error);
    return null;
  }
};

/**
 * Test the backend connection
 * @param {string} backendUrl - URL of the backend API to test
 * @returns {Promise<boolean>} - Promise that resolves to connection status
 */
RAGChatbot.testConnection = async function(backendUrl) {
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
};

// Initialize the chat component when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if auto-initialization is requested
  const autoInitElement = document.querySelector('[data-rag-chatbot-auto-init]');
  if (autoInitElement) {
    const containerId = autoInitElement.getAttribute('data-container-id');
    const backendUrl = autoInitElement.getAttribute('data-backend-url');

    if (containerId) {
      // Wait a bit to ensure all scripts are loaded
      setTimeout(() => {
        if (window.RAGChatbot?.ChatInterface) {
          RAGChatbot.init({
            containerId: containerId,
            backendUrl: backendUrl
          });
        } else {
          console.error('RAGChatbot: Cannot auto-initialize - ChatInterface not loaded');
        }
      }, 100);
    }
  }
});

// Export as a module for ES6 compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RAGChatbot;
}