// Chat interface component for the RAG Chatbot

class ChatInterface {
  /**
   * Creates a new ChatInterface instance
   * @param {string} containerId - ID of the container element for the chat
   * @param {object} options - Configuration options for the chat interface
   * @param {string} options.backendUrl - URL of the backend API
   * @param {string} options.theme - Theme for the chat interface (default: blue-white)
   * @param {number} options.maxHistory - Maximum number of messages to keep in history (default: 100)
   * @param {boolean} options.enableTextSelection - Whether to enable text selection (default: true)
   * @param {boolean} options.defaultOpen - Whether the chat is open by default (default: false)
   */
  constructor(containerId, options = {}) {
    // Validate container exists
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID '${containerId}' not found`);
      return;
    }

    // Set options with defaults
    this.options = {
      backendUrl: options.backendUrl || '',
      theme: options.theme || 'blue-white',
      maxHistory: options.maxHistory || 100,
      enableTextSelection: options.enableTextSelection !== false, // default to true
      defaultOpen: options.defaultOpen || false
    };

    // Initialize properties
    this.session = null;
    this.selectedTextContext = null;
    this.isLoading = false;

    // Initialize the component
    this.init();
  }

  /**
   * Initialize the chat interface
   */
  init() {
    // Create the UI elements
    this.createUI();

    // Initialize session management
    this.initializeSession();

    // Setup event listeners
    this.setupEventListeners();

    // Setup text selection listener if enabled
    if (this.options.enableTextSelection) {
      this.setupTextSelectionListener();
    }

    // Load conversation history if available
    this.loadConversationHistory();

    // Add welcome message
    this.addWelcomeMessage();
  }

  /**
   * Creates the UI elements for the chat interface
   */
  createUI() {
    // Create main chat container
    this.chatContainer = document.createElement('div');
    this.chatContainer.className = `rag-chat-container rag-theme-${this.options.theme}`;
    this.chatContainer.id = 'rag-chat-main-container';

    // Create header
    this.header = document.createElement('div');
    this.header.className = 'rag-chat-header';
    this.header.innerHTML = `
      <span class="rag-chat-header-icon" aria-hidden="true">🤖</span>
      <span>Robotics-AI Book Assistant</span>
    `;

    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'rag-chat-messages';
    this.messagesContainer.id = 'rag-chat-messages';
    this.messagesContainer.setAttribute('aria-live', 'polite');
    this.messagesContainer.setAttribute('aria-label', 'Chat messages');

    // Create input container
    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'rag-chat-input-container';

    // Create input area
    this.inputArea = document.createElement('textarea');
    this.inputArea.className = 'rag-chat-input';
    this.inputArea.id = 'rag-chat-input';
    this.inputArea.placeholder = 'Ask a question about the book...';
    this.inputArea.rows = 1;
    this.inputArea.setAttribute('aria-label', 'Type your question here');
    this.inputArea.setAttribute('aria-describedby', 'rag-chat-input-help');

    // Create help text for accessibility
    const helpText = document.createElement('div');
    helpText.id = 'rag-chat-input-help';
    helpText.className = 'rag-sr-only';
    helpText.textContent = 'Type your question and press Enter or click Send to submit';

    // Create submit button
    this.submitBtn = document.createElement('button');
    this.submitBtn.className = 'rag-chat-submit-btn';
    this.submitBtn.id = 'rag-chat-submit';
    this.submitBtn.textContent = 'Send';
    this.submitBtn.disabled = true; // Initially disabled until user types
    this.submitBtn.setAttribute('aria-label', 'Send question');

    // Assemble the UI
    this.inputContainer.appendChild(this.inputArea);
    this.inputContainer.appendChild(helpText);
    this.inputContainer.appendChild(this.submitBtn);

    this.chatContainer.appendChild(this.header);
    this.chatContainer.appendChild(this.messagesContainer);
    this.chatContainer.appendChild(this.inputContainer);

    this.container.appendChild(this.chatContainer);

    // Setup auto-resizing for the input area
    this.setupInputAutoResize();
  }

  /**
   * Initializes session management
   */
  initializeSession() {
    // Try to restore existing session from storage
    this.session = window.RAGChatbot?.sessionManager?.getCurrentSession();

    if (!this.session) {
      // Create new session if none exists
      this.session = window.RAGChatbot?.sessionManager?.initializeSession();
    }

    if (!this.session) {
      console.error('Failed to initialize or restore session');
    }
  }

  /**
   * Sets up event listeners for the chat interface
   */
  setupEventListeners() {
    // Submit button click
    this.submitBtn.addEventListener('click', () => {
      this.handleSendMessage();
    });

    // Input area events
    this.inputArea.addEventListener('input', (e) => {
      this.handleInput(e);
    });

    // Enter key to submit (with Shift+Enter for new line)
    this.inputArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        if (!this.submitBtn.disabled) {
          this.handleSendMessage();
        }
      }
    });
  }

  /**
   * Sets up text selection listener
   */
  setupTextSelectionListener() {
    // Remove any existing listener first
    if (this.textSelectionCleanup) {
      this.textSelectionCleanup();
    }

    // Setup new text selection listener
    this.textSelectionCleanup = window.RAGChatbot?.textSelection?.setupSelectionListener((selectionDetails) => {
      this.handleTextSelection(selectionDetails);
    });
  }

  /**
   * Handles text selection events
   * @param {object} selectionDetails - Details about the selected text
   */
  handleTextSelection(selectionDetails) {
    if (!selectionDetails || !selectionDetails.selectedText) {
      // Clear any existing context if no text is selected
      this.selectedTextContext = null;
      return;
    }

    // Validate the selection
    const validation = window.RAGChatbot?.validators?.validateSelectedText(selectionDetails.selectedText);
    if (!validation?.isValid) {
      console.warn('Text selection validation failed:', validation?.error);
      return;
    }

    // Store the selected text context
    this.selectedTextContext = selectionDetails;

    // Optionally display a context indicator
    this.displayContextIndicator(selectionDetails.selectedText);
  }

  /**
   * Displays an indicator showing the selected text context
   * @param {string} selectedText - The selected text to display
   */
  displayContextIndicator(selectedText) {
    // Remove any existing context indicator
    const existingIndicator = this.container.querySelector('.rag-context-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create context indicator
    const contextIndicator = document.createElement('div');
    contextIndicator.className = 'rag-context-indicator';
    contextIndicator.innerHTML = `
      <strong>Context:</strong>
      <div class="rag-context-text">${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}</div>
    `;

    // Insert after the header
    this.header.insertAdjacentElement('afterend', contextIndicator);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (contextIndicator.parentNode) {
        contextIndicator.remove();
      }
    }, 5000);
  }

  /**
   * Handles input events for the text area
   * @param {Event} event - The input event
   */
  handleInput(event) {
    // Enable/disable submit button based on input
    this.submitBtn.disabled = event.target.value.trim().length === 0;

    // Auto-resize the input area
    this.resizeInput();
  }

  /**
   * Resizes the input area based on content
   */
  resizeInput() {
    this.inputArea.style.height = 'auto';
    this.inputArea.style.height = Math.min(this.inputArea.scrollHeight, 150) + 'px';
  }

  /**
   * Sets up auto-resizing for the input area
   */
  setupInputAutoResize() {
    // Set initial height
    this.resizeInput();

    // Add input event listener to resize on content change
    this.inputArea.addEventListener('input', () => {
      this.resizeInput();
    });
  }

  /**
   * Handles sending a message
   */
  async handleSendMessage() {
    const messageText = this.inputArea.value.trim();

    if (!messageText) {
      return;
    }

    // Validate the message
    const validation = window.RAGChatbot?.validators?.validateMessage(messageText);
    if (!validation?.isValid) {
      this.displayError(validation?.error || 'Invalid message');
      return;
    }

    // Check if we're already processing a message
    if (this.isLoading) {
      console.warn('Message submission ignored - already processing');
      return;
    }

    // Disable input while processing
    this.inputArea.disabled = true;
    this.submitBtn.disabled = true;
    this.isLoading = true;

    // Create user message object
    const userMessage = {
      id: 'msg-' + Date.now(),
      sender: window.RAGChatbot?.constants?.SENDER_TYPES?.USER || 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      status: window.RAGChatbot?.constants?.MESSAGE_STATUS?.SENT || 'sent'
    };

    // Add user message to UI immediately
    this.displayMessage(userMessage);

    // Add user message to session
    window.RAGChatbot?.sessionManager?.addMessage(userMessage);

    // Clear input and reset height
    this.inputArea.value = '';
    this.inputArea.style.height = 'auto';
    this.inputArea.disabled = false;
    this.submitBtn.disabled = true; // Will be enabled when user types again

    // Prepare context if available
    const context = this.selectedTextContext ? {
      selected_text: this.selectedTextContext.selectedText,
      source_url: this.selectedTextContext.sourceUrl,
      timestamp: this.selectedTextContext.timestamp
    } : null;

    // Clear selected text context after using it
    this.selectedTextContext = null;

    try {
      // Show loading indicator
      const loadingId = this.showLoadingIndicator();

      // Send message to backend
      const response = await window.RAGChatbot?.apiService?.sendQuery(
        messageText,
        this.session?.sessionId,
        context,
        this.options.backendUrl
      );

      // Remove loading indicator
      this.removeLoadingIndicator(loadingId);

      // Create agent message object from response
      const agentMessage = {
        id: 'agent-' + Date.now(),
        sender: window.RAGChatbot?.constants?.SENDER_TYPES?.AGENT || 'agent',
        content: response.response || 'No response received',
        timestamp: new Date().toISOString(),
        status: window.RAGChatbot?.constants?.MESSAGE_STATUS?.DELIVERED || 'delivered',
        sources: response.sources || []
      };

      // Add agent message to UI
      this.displayMessage(agentMessage);

      // Add agent message to session
      window.RAGChatbot?.sessionManager?.addMessage(agentMessage);
    } catch (error) {
      // Remove loading indicator
      this.removeLoadingIndicator();

      // Show error message
      this.displayError(error.message || 'Error sending message');

      // Update the user message status to error
      window.RAGChatbot?.sessionManager?.updateMessage(userMessage.id, {
        status: window.RAGChatbot?.constants?.MESSAGE_STATUS?.ERROR || 'error'
      });
    } finally {
      // Re-enable input
      this.inputArea.disabled = false;
      this.isLoading = false;

      // Scroll to bottom
      this.scrollToBottom();
    }
  }

  /**
   * Displays a message in the chat interface
   * @param {object} message - The message object to display
   */
  displayMessage(message) {
    // Create message bubble using the MessageBubble component
    const messageBubble = window.RAGChatbot?.MessageBubble?.create(message);

    if (messageBubble) {
      this.messagesContainer.appendChild(messageBubble);

      // Scroll to bottom to show the new message
      this.scrollToBottom();
    } else {
      console.error('Failed to create message bubble for message:', message);
    }
  }

  /**
   * Displays an error message
   * @param {string} errorMessage - The error message to display
   */
  displayError(errorMessage) {
    // Create error display using the ErrorDisplay component if available
    if (window.RAGChatbot?.ErrorDisplay) {
      const errorElement = window.RAGChatbot?.ErrorDisplay?.create(errorMessage, {
        type: 'error',
        duration: 5000
      });

      if (errorElement) {
        this.messagesContainer.appendChild(errorElement);
        this.scrollToBottom();
      }
    } else {
      // Fallback: create simple error message
      const errorElement = document.createElement('div');
      errorElement.className = 'rag-error-message';
      errorElement.textContent = errorMessage || 'An error occurred';

      this.messagesContainer.appendChild(errorElement);
      this.scrollToBottom();

      // Remove error message after 5 seconds
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.remove();
        }
      }, 5000);
    }
  }

  /**
   * Shows a loading indicator
   * @returns {string} - ID of the loading indicator for removal
   */
  showLoadingIndicator() {
    const loadingId = 'loading-' + Date.now();

    // Use LoadingIndicator component if available
    if (window.RAGChatbot?.LoadingIndicator) {
      const loadingElement = window.RAGChatbot?.LoadingIndicator?.create({
        message: 'Thinking...',
        size: 'small',
        theme: 'primary'
      });

      loadingElement.id = loadingId;
      this.messagesContainer.appendChild(loadingElement);
      this.scrollToBottom();

      return loadingId;
    } else {
      // Fallback: create simple loading indicator
      const loadingElement = document.createElement('div');
      loadingElement.className = 'rag-loading-indicator';
      loadingElement.id = loadingId;
      loadingElement.innerHTML = `
        <div class="rag-loading-spinner"></div>
        <span>Thinking...</span>
      `;

      this.messagesContainer.appendChild(loadingElement);
      this.scrollToBottom();

      return loadingId;
    }
  }

  /**
   * Removes a loading indicator
   * @param {string} loadingId - ID of the loading indicator to remove
   */
  removeLoadingIndicator(loadingId) {
    let loadingElement;

    if (loadingId) {
      loadingElement = document.getElementById(loadingId);
    } else {
      // If no ID provided, remove any loading indicator
      loadingElement = this.messagesContainer.querySelector('.rag-loading-indicator');
    }

    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
    }
  }

  /**
   * Scrolls the messages container to the bottom
   */
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Loads conversation history from session
   */
  loadConversationHistory() {
    const history = window.RAGChatbot?.sessionManager?.getConversationHistory() || [];

    history.forEach(message => {
      this.displayMessage(message);
    });

    // Scroll to bottom after loading history
    this.scrollToBottom();
  }

  /**
   * Adds a welcome message to the chat
   */
  addWelcomeMessage() {
    if (this.messagesContainer.children.length === 0) {
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        sender: window.RAGChatbot?.constants?.SENDER_TYPES?.AGENT || 'agent',
        content: window.RAGChatbot?.constants?.DEFAULT_MESSAGES?.WELCOME_MESSAGE || 'Hello! I\'m your AI assistant for the Robotics-AI Book. Ask me anything.',
        timestamp: new Date().toISOString(),
        status: window.RAGChatbot?.constants?.MESSAGE_STATUS?.DELIVERED || 'delivered'
      };

      this.displayMessage(welcomeMessage);
    }
  }

  /**
   * Destroys the chat interface and cleans up resources
   */
  destroy() {
    // Remove text selection listener if it exists
    if (this.textSelectionCleanup) {
      this.textSelectionCleanup();
    }

    // Remove event listeners
    if (this.submitBtn) {
      this.submitBtn.removeEventListener('click', this.handleSendMessage);
    }

    if (this.inputArea) {
      this.inputArea.removeEventListener('input', this.handleInput);
      this.inputArea.removeEventListener('keydown', this.handleInputKeyDown);
    }

    // Clear the container
    if (this.container && this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer);
    }
  }
}

// Export as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatInterface;
} else if (typeof window !== 'undefined') {
  window.RAGChatbot = window.RAGChatbot || {};
  window.RAGChatbot.ChatInterface = ChatInterface;
}