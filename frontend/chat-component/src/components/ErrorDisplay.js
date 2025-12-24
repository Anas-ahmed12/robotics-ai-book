// Error display component for the RAG Chatbot

class ErrorDisplay {
  /**
   * Creates an error message element
   * @param {string|object} error - Error message string or error object
   * @param {object} options - Configuration options for the error display
   * @returns {HTMLElement} - The error message DOM element
   */
  static create(error, options = {}) {
    const defaultOptions = {
      type: options.type || 'general', // general, network, validation, timeout
      duration: options.duration || 0, // 0 means permanent, positive number means milliseconds
      closable: options.closable !== false, // default to true
      onDismiss: options.onDismiss || null,
      showIcon: options.showIcon !== false // default to true
    };

    // Normalize error to string
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || error.detail || JSON.stringify(error);
    } else {
      errorMessage = window.RAGChatbot?.constants?.DEFAULT_MESSAGES?.ERROR_MESSAGE || 'An error occurred';
    }

    // Create container
    const container = document.createElement('div');
    container.className = `rag-error-display rag-error-type-${defaultOptions.type}`;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'rag-error-content';

    if (defaultOptions.showIcon) {
      // Create icon element
      const icon = document.createElement('div');
      icon.className = 'rag-error-icon';
      icon.innerHTML = '⚠️'; // Warning emoji, could be replaced with SVG
      contentWrapper.appendChild(icon);
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'rag-error-message';
    messageElement.textContent = errorMessage;
    contentWrapper.appendChild(messageElement);

    if (defaultOptions.closable) {
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'rag-error-close-btn';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close error message');
      closeButton.onclick = () => {
        this.dismiss(container);
        if (defaultOptions.onDismiss) {
          defaultOptions.onDismiss();
        }
      };
      contentWrapper.appendChild(closeButton);
    }

    // Add content to container
    container.appendChild(contentWrapper);

    // Set auto-dismiss timer if duration is specified
    if (defaultOptions.duration > 0) {
      setTimeout(() => {
        this.dismiss(container);
      }, defaultOptions.duration);
    }

    return container;
  }

  /**
   * Shows an error message in a container
   * @param {HTMLElement} container - The container to show the error in
   * @param {string|object} error - Error message or object
   * @param {object} options - Configuration options for the error display
   * @returns {HTMLElement} - The error element that was added
   */
  static show(container, error, options = {}) {
    if (!container) {
      console.error('Container not provided to ErrorDisplay.show');
      return null;
    }

    // Create error element
    const errorElement = this.create(error, options);

    // Add error message to container
    container.appendChild(errorElement);

    return errorElement;
  }

  /**
   * Shows a temporary error message in a container
   * @param {HTMLElement} container - The container to show the error in
   * @param {string|object} error - Error message or object
   * @param {object} options - Configuration options for the error display
   * @returns {Function} - Function to dismiss the error message
   */
  static showTemporary(container, error, options = {}) {
    if (!container) {
      console.error('Container not provided to ErrorDisplay.showTemporary');
      return () => {};
    }

    // Create error element with default duration if not specified
    const effectiveOptions = {
      ...options,
      duration: options.duration || 5000 // Default to 5 seconds
    };

    // Create error element
    const errorElement = this.create(error, effectiveOptions);

    // Clear container and add error message
    container.innerHTML = '';
    container.appendChild(errorElement);

    // Return function to dismiss the error
    return () => {
      this.dismiss(errorElement);
    };
  }

  /**
   * Dismisses an error message
   * @param {HTMLElement} errorElement - The error element to dismiss
   */
  static dismiss(errorElement) {
    if (!errorElement) {
      console.error('Error element not provided to ErrorDisplay.dismiss');
      return;
    }

    // Remove the element from the DOM
    if (errorElement.parentNode) {
      errorElement.parentNode.removeChild(errorElement);
    }
  }

  /**
   * Creates a network error display
   * @param {string} message - Network error message
   * @param {object} options - Additional options
   * @returns {HTMLElement} - Network error element
   */
  static createNetworkError(message, options = {}) {
    return this.create(message, {
      type: 'network',
      ...options
    });
  }

  /**
   * Creates a validation error display
   * @param {string} message - Validation error message
   * @param {object} options - Additional options
   * @returns {HTMLElement} - Validation error element
   */
  static createValidationError(message, options = {}) {
    return this.create(message, {
      type: 'validation',
      ...options
    });
  }

  /**
   * Creates a timeout error display
   * @param {string} message - Timeout error message
   * @param {object} options - Additional options
   * @returns {HTMLElement} - Timeout error element
   */
  static createTimeoutError(message, options = {}) {
    return this.create(message, {
      type: 'timeout',
      ...options
    });
  }

  /**
   * Displays a list of errors
   * @param {HTMLElement} container - Container to display errors in
   * @param {Array<string|object>} errors - Array of error messages or objects
   * @param {object} options - Configuration options
   * @returns {Array<HTMLElement>} - Array of error elements created
   */
  static showMultipleErrors(container, errors, options = {}) {
    if (!container || !Array.isArray(errors)) {
      console.error('Invalid parameters provided to ErrorDisplay.showMultipleErrors');
      return [];
    }

    const errorElements = [];

    errors.forEach(error => {
      const errorElement = this.create(error, options);
      container.appendChild(errorElement);
      errorElements.push(errorElement);
    });

    return errorElements;
  }
}

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorDisplay;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.ErrorDisplay = ErrorDisplay;
}