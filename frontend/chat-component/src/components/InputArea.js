// Question input component with text selection support for the RAG Chatbot

class InputArea {
  /**
   * Creates an input area element
   * @param {object} options - Configuration options for the input area
   * @returns {object} - Object containing the input element and control methods
   */
  static create(options = {}) {
    const defaultOptions = {
      placeholder: options.placeholder || 'Ask a question about the book...',
      rows: options.rows || 1,
      maxRows: options.maxRows || 5,
      onSend: options.onSend || null,
      onInput: options.onInput || null,
      onTextSelected: options.onTextSelected || null,
      enableTextSelection: options.enableTextSelection !== false, // default to true
      disabled: options.disabled || false
    };

    // Create container
    const container = document.createElement('div');
    container.className = 'rag-chat-input-container';

    // Create input area (textarea)
    const input = document.createElement('textarea');
    input.className = 'rag-chat-input';
    input.placeholder = defaultOptions.placeholder;
    input.rows = defaultOptions.rows;
    input.disabled = defaultOptions.disabled;

    // Create submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'rag-chat-submit-btn';
    submitBtn.textContent = 'Send';
    submitBtn.disabled = true; // Initially disabled until user types

    // Add elements to container
    container.appendChild(input);
    container.appendChild(submitBtn);

    // Setup auto-resizing
    this.setupAutoResize(input, defaultOptions.maxRows);

    // Setup event listeners
    this.setupEventListeners(
      input,
      submitBtn,
      defaultOptions,
      (message) => {
        // When a message is sent, clear the input and reset height
        input.value = '';
        input.style.height = 'auto';
        submitBtn.disabled = true;
      }
    );

    // Return the container and control methods
    return {
      container: container,
      input: input,
      submitBtn: submitBtn,
      enable: () => {
        input.disabled = false;
        submitBtn.disabled = input.value.trim().length === 0;
      },
      disable: () => {
        input.disabled = true;
        submitBtn.disabled = true;
      },
      clear: () => {
        input.value = '';
        input.style.height = 'auto';
        submitBtn.disabled = true;
      },
      focus: () => {
        input.focus();
      },
      setValue: (value) => {
        input.value = value;
        // Trigger input event to update UI
        input.dispatchEvent(new Event('input', { bubbles: true }));
      },
      getValue: () => input.value,
      addContext: (contextText) => {
        // Add context text to the input, if it's not already there
        if (contextText && !input.value.includes(contextText)) {
          const currentText = input.value;
          input.value = currentText ? `${contextText}\n\n${currentText}` : contextText;
          // Trigger input event to update UI
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };
  }

  /**
   * Sets up auto-resizing for the input area
   * @param {HTMLTextAreaElement} input - The textarea element
   * @param {number} maxRows - Maximum number of rows to grow to
   */
  static setupAutoResize(input, maxRows) {
    const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);
    const maxHeight = lineHeight * maxRows;

    input.addEventListener('input', function() {
      this.style.height = 'auto';
      const newHeight = Math.min(this.scrollHeight, maxHeight);
      this.style.height = newHeight + 'px';

      // Adjust parent container height if needed
      if (this.parentNode) {
        this.parentNode.style.height = 'auto';
      }
    });

    // Initialize height
    input.dispatchEvent(new Event('input'));
  }

  /**
   * Sets up event listeners for the input area
   * @param {HTMLTextAreaElement} input - The textarea element
   * @param {HTMLButtonElement} submitBtn - The submit button
   * @param {object} options - Configuration options
   * @param {function} onSendCallback - Callback function when message is sent
   */
  static setupEventListeners(input, submitBtn, options, onSendCallback) {
    // Update submit button state based on input
    input.addEventListener('input', function() {
      submitBtn.disabled = this.value.trim().length === 0;

      // Call the onInput callback if provided
      if (options.onInput) {
        options.onInput(this.value);
      }
    });

    // Handle send on button click
    submitBtn.addEventListener('click', function() {
      if (!submitBtn.disabled && options.onSend) {
        options.onSend(input.value.trim());
        if (onSendCallback) {
          onSendCallback(input.value.trim());
        }
      }
    });

    // Handle send on Enter key (with Shift+Enter for new line)
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        if (!submitBtn.disabled && options.onSend) {
          options.onSend(input.value.trim());
          if (onSendCallback) {
            onSendCallback(input.value.trim());
          }
        }
      }
    });

    // Setup text selection listener if enabled
    if (options.enableTextSelection && options.onTextSelected) {
      let selectionTimeout = null;

      const handleSelection = () => {
        // Clear any existing timeout
        if (selectionTimeout) {
          clearTimeout(selectionTimeout);
        }

        // Set a new timeout to avoid calling the callback multiple times during selection
        selectionTimeout = setTimeout(() => {
          if (window.RAGChatbot?.textSelection) {
            const selectionDetails = window.RAGChatbot?.textSelection?.getSelectionDetails();
            if (selectionDetails && selectionDetails.selectedText) {
              options.onTextSelected(selectionDetails);
            }
          }
        }, 150);
      };

      // Add event listeners for text selection
      document.addEventListener('mouseup', handleSelection);
      document.addEventListener('keyup', handleSelection);
      document.addEventListener('touchend', handleSelection);

      // Store the cleanup function for later use
      input._cleanupSelectionListener = function() {
        document.removeEventListener('mouseup', handleSelection);
        document.removeEventListener('keyup', handleSelection);
        document.removeEventListener('touchend', handleSelection);

        if (selectionTimeout) {
          clearTimeout(selectionTimeout);
        }
      };
    }
  }

  /**
   * Validates the input content
   * @param {string} content - Content to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  static validateInput(content) {
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        error: 'Input is required and must be a string'
      };
    }

    if (content.trim().length === 0) {
      return {
        isValid: false,
        error: 'Input cannot be empty'
      };
    }

    const maxLen = window.RAGChatbot?.constants?.MAX_MESSAGE_LENGTH || 2000;
    if (content.length > maxLen) {
      return {
        isValid: false,
        error: `Input exceeds maximum length of ${maxLen} characters`
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Gets the current input value and validates it
   * @param {HTMLTextAreaElement} input - The textarea element
   * @returns {object} - Object with value and validation result
   */
  static getValueWithValidation(input) {
    const value = input ? input.value : '';
    const validation = this.validateInput(value);

    return {
      value: value,
      validation: validation
    };
  }
}

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputArea;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.InputArea = InputArea;
}