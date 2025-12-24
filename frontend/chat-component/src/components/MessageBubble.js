// Individual message bubble component for the RAG Chatbot

class MessageBubble {
  /**
   * Creates a message bubble element
   * @param {object} message - Message object with id, sender, content, timestamp, status
   * @param {object} options - Additional options for the message bubble
   * @returns {HTMLElement} - The message bubble DOM element
   */
  static create(message, options = {}) {
    // Validate message object
    if (!message || !message.sender || message.content === undefined) {
      console.error('Invalid message object provided to MessageBubble.create');
      return null;
    }

    // Create message bubble container
    const bubble = document.createElement('div');
    bubble.className = `rag-message-bubble rag-message-${message.sender}`;
    bubble.dataset.messageId = message.id || `msg-${Date.now()}`;
    bubble.dataset.sender = message.sender;

    // Add status class if available
    if (message.status) {
      bubble.classList.add(`rag-message-${message.status}`);
    }

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'rag-message-content';

    // Process and set content
    contentWrapper.innerHTML = this.formatContent(message.content);

    // Create timestamp element
    const timestampElement = document.createElement('div');
    timestampElement.className = 'rag-message-timestamp';
    timestampElement.textContent = this.formatTimestamp(message.timestamp);

    // Add sources if available (for agent messages)
    if (message.sources && message.sources.length > 0) {
      const sourcesElement = document.createElement('div');
      sourcesElement.className = 'rag-message-sources';
      sourcesElement.innerHTML = this.createSourcesHTML(message.sources);
      contentWrapper.appendChild(sourcesElement);
    }

    // Add message ID for debugging/identification
    if (message.id) {
      contentWrapper.dataset.messageId = message.id;
    }

    // Assemble the bubble
    bubble.appendChild(contentWrapper);
    bubble.appendChild(timestampElement);

    // Add any additional classes from options
    if (options.additionalClasses && Array.isArray(options.additionalClasses)) {
      bubble.classList.add(...options.additionalClasses);
    }

    return bubble;
  }

  /**
   * Formats the message content for display
   * @param {string} content - Raw message content
   * @returns {string} - Formatted HTML content
   */
  static formatContent(content) {
    if (!content) {
      return '';
    }

    // Escape HTML to prevent XSS
    const escapedContent = this.escapeHtml(content);

    // Convert newlines to <br> tags
    let formattedContent = escapedContent.replace(/\n/g, '<br>');

    // Convert URLs to clickable links (basic implementation)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formattedContent = formattedContent.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    return formattedContent;
  }

  /**
   * Escapes HTML in text to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formats timestamp for display
   * @param {string} timestamp - ISO string timestamp
   * @returns {string} - Formatted time string
   */
  static formatTimestamp(timestamp) {
    if (!timestamp) {
      // If no timestamp provided, use current time
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    try {
      const date = new Date(timestamp);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return '';
      }

      // Format as HH:MM (e.g., 14:30)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  }

  /**
   * Creates HTML for sources display
   * @param {array} sources - Array of source objects
   * @returns {string} - HTML string for sources
   */
  static createSourcesHTML(sources) {
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return '';
    }

    let sourcesHTML = '<div class="rag-message-sources-list"><strong>Sources:</strong><ul>';

    // Limit to first 3 sources to avoid cluttering the message
    const limitedSources = sources.slice(0, 3);

    limitedSources.forEach(source => {
      sourcesHTML += '<li class="rag-message-source-item">';

      if (source.metadata && source.metadata.source_url) {
        sourcesHTML += `<a href="${this.escapeHtml(source.metadata.source_url)}" target="_blank" rel="noopener noreferrer">`;
        sourcesHTML += this.escapeHtml(source.metadata.source_url);
        sourcesHTML += '</a>';
      } else if (source.content) {
        // Use first 50 characters of content as source identifier
        const sourcePreview = source.content.substring(0, 50) + (source.content.length > 50 ? '...' : '');
        sourcesHTML += this.escapeHtml(sourcePreview);
      } else {
        sourcesHTML += 'Reference material';
      }

      sourcesHTML += '</li>';
    });

    if (sources.length > 3) {
      sourcesHTML += `<li class="rag-message-source-item">... and ${sources.length - 3} more</li>`;
    }

    sourcesHTML += '</ul></div>';

    return sourcesHTML;
  }

  /**
   * Updates an existing message bubble
   * @param {HTMLElement} bubbleElement - The message bubble element to update
   * @param {object} updates - Object with properties to update
   */
  static update(bubbleElement, updates) {
    if (!bubbleElement || !updates) {
      return;
    }

    // Update content if provided
    if (updates.content !== undefined) {
      const contentElement = bubbleElement.querySelector('.rag-message-content');
      if (contentElement) {
        contentElement.innerHTML = this.formatContent(updates.content);
      }
    }

    // Update timestamp if provided
    if (updates.timestamp) {
      const timestampElement = bubbleElement.querySelector('.rag-message-timestamp');
      if (timestampElement) {
        timestampElement.textContent = this.formatTimestamp(updates.timestamp);
      }
    }

    // Update status if provided
    if (updates.status) {
      // Remove any existing status classes
      const statusClasses = Array.from(bubbleElement.classList).filter(cls => cls.startsWith('rag-message-'));
      statusClasses.forEach(cls => bubbleElement.classList.remove(cls));

      // Add the new status class
      bubbleElement.classList.add(`rag-message-${updates.status}`);
    }

    // Update sources if provided
    if (updates.sources) {
      const sourcesElement = bubbleElement.querySelector('.rag-message-sources');
      if (sourcesElement) {
        sourcesElement.innerHTML = this.createSourcesHTML(updates.sources);
      } else {
        // If no sources element exists, create one
        const contentElement = bubbleElement.querySelector('.rag-message-content');
        if (contentElement) {
          const newSourcesElement = document.createElement('div');
          newSourcesElement.className = 'rag-message-sources';
          newSourcesElement.innerHTML = this.createSourcesHTML(updates.sources);
          contentElement.appendChild(newSourcesElement);
        }
      }
    }
  }

  /**
   * Creates a pending message bubble for temporary display
   * @param {string} content - Message content
   * @param {string} sender - Message sender ('user' or 'agent')
   * @returns {HTMLElement} - Pending message bubble element
   */
  static createPending(content, sender) {
    const message = {
      id: `pending-${Date.now()}`,
      sender: sender,
      content: content,
      timestamp: new Date().toISOString(),
      status: window.RAGChatbot?.constants?.MESSAGE_STATUS?.PENDING || 'pending'
    };

    const bubble = this.create(message);

    // Add a special class for pending messages
    if (bubble) {
      bubble.classList.add('rag-message-pending');
    }

    return bubble;
  }

  /**
   * Sorts messages by timestamp for chronological display
   * @param {array} messages - Array of message objects
   * @returns {array} - Sorted array of message objects
   */
  static sortMessages(messages) {
    if (!messages || !Array.isArray(messages)) {
      return [];
    }

    return messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB; // Ascending order (oldest first)
    });
  }

  /**
   * Creates a container for multiple message bubbles
   * @param {array} messages - Array of message objects
   * @param {object} options - Additional options for the message bubbles
   * @returns {HTMLElement} - Container with all message bubbles
   */
  static createMessageContainer(messages, options = {}) {
    const container = document.createElement('div');
    container.className = 'rag-messages-container';

    // Sort messages by timestamp before displaying
    const sortedMessages = this.sortMessages(messages);

    sortedMessages.forEach(message => {
      const bubble = this.create(message, options);
      if (bubble) {
        container.appendChild(bubble);
      }
    });

    return container;
  }
}

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessageBubble;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.MessageBubble = MessageBubble;
}