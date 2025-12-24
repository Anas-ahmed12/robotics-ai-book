// Text selection service for the RAG Chatbot component

const TextSelection = {
  /**
   * Gets the currently selected text from the page
   * @returns {string} - The selected text or empty string if no text is selected
   */
  getSelectedText: function() {
    let selectedText = '';

    // Modern browsers
    if (window.getSelection) {
      selectedText = window.getSelection().toString().trim();
    }
    // IE support
    else if (document.selection && document.selection.type !== 'Control') {
      selectedText = document.selection.createRange().text.trim();
    }

    return selectedText;
  },

  /**
   * Gets detailed information about the current text selection
   * @returns {object|null} - Object containing selected text and metadata, or null if no selection
   */
  getSelectionDetails: function() {
    const selectedText = this.getSelectedText();

    if (!selectedText) {
      return null;
    }

    // Get selection object
    let selection = null;
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.selection && document.selection.type !== 'Control') {
      selection = document.selection;
    }

    if (!selection || selection.toString().trim() !== selectedText) {
      // Fallback: just return basic info
      return {
        selectedText: selectedText,
        sourceUrl: window.location.href,
        timestamp: new Date().toISOString()
      };
    }

    // Try to get more detailed selection information
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const containerElement = range ? range.commonAncestorContainer.parentElement : null;

    const details = {
      selectedText: selectedText,
      sourceUrl: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Add offset information if available
    if (range) {
      try {
        details.selectionStartOffset = range.startOffset;
        details.selectionEndOffset = range.endOffset;

        // Add container information
        if (containerElement) {
          details.containerId = containerElement.id || null;
          details.containerClass = containerElement.className || null;
        }
      } catch (e) {
        // Some range properties may not be available, that's OK
        console.debug('Could not get detailed selection info:', e);
      }
    }

    return details;
  },

  /**
   * Validates the selected text against constraints
   * @param {string} selectedText - The text to validate
   * @returns {object} - Validation result with isValid and error properties
   */
  validateSelection: function(selectedText) {
    if (!selectedText) {
      return {
        isValid: false,
        error: 'No text selected'
      };
    }

    if (typeof selectedText !== 'string') {
      return {
        isValid: false,
        error: 'Selected text must be a string'
      };
    }

    if (selectedText.trim().length === 0) {
      return {
        isValid: false,
        error: 'Selected text cannot be empty or whitespace only'
      };
    }

    // Check length against max allowed
    const maxLength = window.RAGChatbot?.constants?.TEXT_SELECTION_CONFIG?.MAX_SELECTION_LENGTH || 1000;
    if (selectedText.length > maxLength) {
      return {
        isValid: false,
        error: `Selected text exceeds maximum length of ${maxLength} characters`
      };
    }

    return {
      isValid: true,
      error: null
    };
  },

  /**
   * Prepares the selected text context for API submission
   * @param {object} selectionDetails - Details from getSelectionDetails
   * @returns {object|null} - Prepared context object for API or null if invalid
   */
  prepareContextForApi: function(selectionDetails) {
    if (!selectionDetails || !selectionDetails.selectedText) {
      return null;
    }

    // Validate the selection first
    const validation = this.validateSelection(selectionDetails.selectedText);
    if (!validation.isValid) {
      console.warn('Text selection validation failed:', validation.error);
      return null;
    }

    // Prepare context object for API
    const context = {
      selected_text: selectionDetails.selectedText,
      source_url: selectionDetails.sourceUrl,
      timestamp: selectionDetails.timestamp
    };

    // Add optional fields if available
    if (selectionDetails.containerId) {
      context.container_id = selectionDetails.containerId;
    }

    if (selectionDetails.containerClass) {
      context.container_class = selectionDetails.containerClass;
    }

    if (selectionDetails.selectionStartOffset !== undefined) {
      context.selection_start_offset = selectionDetails.selectionStartOffset;
    }

    if (selectionDetails.selectionEndOffset !== undefined) {
      context.selection_end_offset = selectionDetails.selectionEndOffset;
    }

    return context;
  },

  /**
   * Sets up event listeners to detect text selection
   * @param {function} callback - Function to call when text is selected
   * @returns {function} - Function to remove the event listeners
   */
  setupSelectionListener: function(callback) {
    if (typeof callback !== 'function') {
      console.error('Callback must be a function');
      return () => {};
    }

    let selectionTimeout = null;

    const handleSelection = () => {
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      // Debounce the selection event to avoid firing too frequently
      selectionTimeout = setTimeout(() => {
        const selectionDetails = this.getSelectionDetails();

        if (selectionDetails) {
          callback(selectionDetails);
        }
      }, window.RAGChatbot?.constants?.DEBOUNCE_DELAY || 300);
    };

    // Add event listeners for text selection
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    // Also listen for touch events on mobile devices
    document.addEventListener('touchend', handleSelection);

    // Return a function to remove the listeners
    return function removeListeners() {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('touchend', handleSelection);

      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  },

  /**
   * Highlights selected text visually (for UI feedback)
   * @param {string} text - The text to highlight
   */
  highlightSelectedText: function(text) {
    // This is a UI enhancement feature that could be implemented in the future
    // For now, we'll just log it as a potential enhancement
    console.log('Text selection highlight feature - text:', text);
  },

  /**
   * Clears any active text selection in the document
   */
  clearSelection: function() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
  },

  /**
   * Gets the length of the selected text
   * @param {string} selectedText - The selected text
   * @returns {number} - Length of the selected text
   */
  getSelectionLength: function(selectedText) {
    if (!selectedText || typeof selectedText !== 'string') {
      return 0;
    }
    return selectedText.length;
  },

  /**
   * Gets a preview of the selected text (first N characters)
   * @param {string} selectedText - The selected text
   * @param {number} maxLength - Maximum length for the preview (default: 100)
   * @returns {string} - Preview of the selected text
   */
  getTextPreview: function(selectedText, maxLength = 100) {
    if (!selectedText || typeof selectedText !== 'string') {
      return '';
    }

    if (selectedText.length <= maxLength) {
      return selectedText;
    }

    return selectedText.substring(0, maxLength) + '...';
  },

  /**
   * Checks if text is currently selected
   * @returns {boolean} - True if text is selected, false otherwise
   */
  isTextSelected: function() {
    const selectedText = this.getSelectedText();
    return !!selectedText && selectedText.trim().length > 0;
  },

  /**
   * Gets the coordinates of the text selection (if possible)
   * @returns {object|null} - Object with x, y coordinates of selection or null if not available
   */
  getSelectionCoordinates: function() {
    if (!window.getSelection) {
      return null;
    }

    const selection = window.getSelection();
    if (!selection.rangeCount) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Check if the rectangle is valid
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }

    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  },

  /**
   * Copies selected text to clipboard (if needed for advanced functionality)
   * @param {string} text - Text to copy to clipboard
   * @returns {Promise<boolean>} - Promise that resolves to success status
   */
  copyToClipboard: async function(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
      return false;
    }
  }
};

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextSelection;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.textSelection = TextSelection;
}