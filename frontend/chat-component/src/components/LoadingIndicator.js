// Loading indicator component for the RAG Chatbot

class LoadingIndicator {
  /**
   * Creates a loading indicator element
   * @param {object} options - Configuration options for the loading indicator
   * @returns {HTMLElement} - The loading indicator DOM element
   */
  static create(options = {}) {
    const defaultOptions = {
      message: options.message || 'Thinking...',
      size: options.size || 'medium', // small, medium, large
      theme: options.theme || 'default', // default, primary, secondary
      showSpinner: options.showSpinner !== false, // default to true
      showText: options.showText !== false // default to true
    };

    // Create container
    const container = document.createElement('div');
    container.className = `rag-loading-indicator rag-loading-${defaultOptions.size} rag-loading-theme-${defaultOptions.theme}`;

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'rag-loading-content';

    if (defaultOptions.showSpinner) {
      // Create spinner element
      const spinner = document.createElement('div');
      spinner.className = 'rag-loading-spinner';
      contentWrapper.appendChild(spinner);
    }

    if (defaultOptions.showText) {
      // Create message element
      const messageElement = document.createElement('div');
      messageElement.className = 'rag-loading-message';
      messageElement.textContent = defaultOptions.message;
      contentWrapper.appendChild(messageElement);
    }

    // Add content to container
    container.appendChild(contentWrapper);

    return container;
  }

  /**
   * Shows a temporary loading indicator in a container
   * @param {HTMLElement} container - The container to show the loading indicator in
   * @param {object} options - Configuration options for the loading indicator
   * @returns {Function} - Function to remove the loading indicator
   */
  static showTemporary(container, options = {}) {
    if (!container) {
      console.error('Container not provided to LoadingIndicator.showTemporary');
      return () => {};
    }

    // Create loading indicator
    const loadingElement = this.create(options);

    // Clear container and add loading indicator
    container.innerHTML = '';
    container.appendChild(loadingElement);

    // Return function to remove the loading indicator
    return () => {
      if (loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
      }
    };
  }

  /**
   * Shows a loading indicator in a container
   * @param {HTMLElement} container - The container to show the loading indicator in
   * @param {object} options - Configuration options for the loading indicator
   * @returns {HTMLElement} - The loading indicator element that was added
   */
  static show(container, options = {}) {
    if (!container) {
      console.error('Container not provided to LoadingIndicator.show');
      return null;
    }

    // Create loading indicator
    const loadingElement = this.create(options);

    // Add to container
    container.appendChild(loadingElement);

    return loadingElement;
  }

  /**
   * Hides a loading indicator
   * @param {HTMLElement} loadingElement - The loading indicator element to remove
   */
  static hide(loadingElement) {
    if (!loadingElement) {
      console.error('Loading element not provided to LoadingIndicator.hide');
      return;
    }

    if (loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Updates the message of a loading indicator
   * @param {HTMLElement} loadingElement - The loading indicator element to update
   * @param {string} message - New message to display
   */
  static updateMessage(loadingElement, message) {
    if (!loadingElement) {
      console.error('Loading element not provided to LoadingIndicator.updateMessage');
      return;
    }

    const messageElement = loadingElement.querySelector('.rag-loading-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
  }
}

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingIndicator;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.LoadingIndicator = LoadingIndicator;
}