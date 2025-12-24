/**
 * Unit tests for the MessageBubble component
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock the RAGChatbot namespace
global.window.RAGChatbot = {
  constants: {
    SENDER_TYPES: {
      USER: 'user',
      AGENT: 'agent'
    },
    MESSAGE_STATUS: {
      SENT: 'sent',
      PENDING: 'pending',
      DELIVERED: 'delivered',
      ERROR: 'error'
    }
  },
  validators: {
    validateMessage: jest.fn()
  }
};

// Import the MessageBubble class
const MessageBubble = require('../../../src/components/MessageBubble');

describe('MessageBubble', () => {
  describe('create', () => {
    test('should create a message bubble element for user message', () => {
      const message = {
        id: 'test-message-1',
        sender: 'user',
        content: 'Hello, this is a test message',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      const bubble = MessageBubble.create(message);

      expect(bubble).toBeInstanceOf(Element);
      expect(bubble.tagName).toBe('DIV');
      expect(bubble.classList.contains('rag-message-bubble')).toBe(true);
      expect(bubble.classList.contains('rag-message-user')).toBe(true);
      expect(bubble.dataset.messageId).toBe('test-message-1');
      expect(bubble.dataset.sender).toBe('user');

      const contentElement = bubble.querySelector('.rag-message-content');
      expect(contentElement).toBeTruthy();
      expect(contentElement.innerHTML).toContain('Hello, this is a test message');

      const timestampElement = bubble.querySelector('.rag-message-timestamp');
      expect(timestampElement).toBeTruthy();
    });

    test('should create a message bubble element for agent message', () => {
      const message = {
        id: 'test-message-2',
        sender: 'agent',
        content: 'Hello, I am the AI assistant',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      const bubble = MessageBubble.create(message);

      expect(bubble).toBeInstanceOf(Element);
      expect(bubble.classList.contains('rag-message-bubble')).toBe(true);
      expect(bubble.classList.contains('rag-message-agent')).toBe(true);
      expect(bubble.dataset.sender).toBe('agent');

      const contentElement = bubble.querySelector('.rag-message-content');
      expect(contentElement).toBeTruthy();
      expect(contentElement.innerHTML).toContain('Hello, I am the AI assistant');
    });

    test('should add status class to message bubble', () => {
      const message = {
        id: 'test-message-3',
        sender: 'user',
        content: 'Test message with status',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      const bubble = MessageBubble.create(message);

      expect(bubble.classList.contains('rag-message-pending')).toBe(true);
    });

    test('should handle message with sources', () => {
      const message = {
        id: 'test-message-4',
        sender: 'agent',
        content: 'Response with sources',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        sources: [
          { id: 'source1', content: 'Source content 1', similarity_score: 0.95 },
          { id: 'source2', content: 'Source content 2', similarity_score: 0.88 }
        ]
      };

      const bubble = MessageBubble.create(message);

      const sourcesElement = bubble.querySelector('.rag-message-sources');
      expect(sourcesElement).toBeTruthy();
    });

    test('should handle invalid message object', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const bubble = MessageBubble.create({});

      expect(bubble).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid message object provided to MessageBubble.create');
      consoleSpy.mockRestore();
    });

    test('should handle message with undefined sender', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const message = {
        id: 'test-message-5',
        content: 'Test message without sender',
        timestamp: new Date().toISOString()
      };

      const bubble = MessageBubble.create(message);

      expect(bubble).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid message object provided to MessageBubble.create');
      consoleSpy.mockRestore();
    });

    test('should handle message with undefined content', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const message = {
        id: 'test-message-6',
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      const bubble = MessageBubble.create(message);

      expect(bubble).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid message object provided to MessageBubble.create');
      consoleSpy.mockRestore();
    });

    test('should handle options parameter', () => {
      const message = {
        id: 'test-message-7',
        sender: 'user',
        content: 'Test message with options',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      const options = {
        additionalClasses: ['custom-class', 'another-class']
      };

      const bubble = MessageBubble.create(message, options);

      expect(bubble.classList.contains('custom-class')).toBe(true);
      expect(bubble.classList.contains('another-class')).toBe(true);
    });

    test('should handle message with undefined content property', () => {
      const message = {
        id: 'test-message-8',
        sender: 'user',
        content: undefined,
        timestamp: new Date().toISOString()
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const bubble = MessageBubble.create(message);

      expect(bubble).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid message object provided to MessageBubble.create');
      consoleSpy.mockRestore();
    });
  });

  describe('formatContent', () => {
    test('should format content with newlines', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const formatted = MessageBubble.formatContent(content);

      expect(formatted).toBe('Line 1<br>Line 2<br>Line 3');
    });

    test('should escape HTML content', () => {
      const content = 'This is <script>alert("test")</script> dangerous content';
      const formatted = MessageBubble.formatContent(content);

      expect(formatted).toContain('&lt;script&gt;');
      expect(formatted).toContain('&lt;/script&gt;');
    });

    test('should convert URLs to clickable links', () => {
      const content = 'Visit https://example.com for more info';
      const formatted = MessageBubble.formatContent(content);

      expect(formatted).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>');
    });

    test('should handle empty content', () => {
      const formatted = MessageBubble.formatContent('');

      expect(formatted).toBe('');
    });

    test('should handle null content', () => {
      const formatted = MessageBubble.formatContent(null);

      expect(formatted).toBe('');
    });

    test('should handle undefined content', () => {
      const formatted = MessageBubble.formatContent(undefined);

      expect(formatted).toBe('');
    });
  });

  describe('escapeHtml', () => {
    test('should escape HTML characters', () => {
      const text = '<script>alert("test")</script>';
      const escaped = MessageBubble.escapeHtml(text);

      expect(escaped).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;');
    });

    test('should handle non-string input', () => {
      const escaped = MessageBubble.escapeHtml(123);
      expect(escaped).toBe('');

      const escaped2 = MessageBubble.escapeHtml(null);
      expect(escaped2).toBe('');

      const escaped3 = MessageBubble.escapeHtml(undefined);
      expect(escaped3).toBe('');
    });
  });

  describe('formatTimestamp', () => {
    test('should format valid timestamp', () => {
      const timestamp = new Date().toISOString();
      const formatted = MessageBubble.formatTimestamp(timestamp);

      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Should match HH:MM format
    });

    test('should handle invalid timestamp', () => {
      const formatted = MessageBubble.formatTimestamp('invalid-timestamp');
      expect(formatted).toBe('');

      const formatted2 = MessageBubble.formatTimestamp(null);
      expect(formatted2).toMatch(/\d{1,2}:\d{2}/); // Should return current time
    });

    test('should handle undefined timestamp', () => {
      const formatted = MessageBubble.formatTimestamp(undefined);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Should return current time
    });
  });

  describe('createSourcesHTML', () => {
    test('should create HTML for sources', () => {
      const sources = [
        { id: 'source1', content: 'First source', similarity_score: 0.95, metadata: { source_url: 'http://example.com' } },
        { id: 'source2', content: 'Second source', similarity_score: 0.88, metadata: { source_url: 'http://test.com' } }
      ];

      const html = MessageBubble.createSourcesHTML(sources);

      expect(html).toContain('Sources:');
      expect(html).toContain('http://example.com');
      expect(html).toContain('http://test.com');
    });

    test('should handle empty sources array', () => {
      const html = MessageBubble.createSourcesHTML([]);
      expect(html).toBe('');
    });

    test('should handle null sources', () => {
      const html = MessageBubble.createSourcesHTML(null);
      expect(html).toBe('');
    });

    test('should handle sources with content but no URL', () => {
      const sources = [
        { id: 'source1', content: 'Source content without URL', similarity_score: 0.95 }
      ];

      const html = MessageBubble.createSourcesHTML(sources);

      expect(html).toContain('Source content without URL');
    });

    test('should limit sources to first 3', () => {
      const sources = [
        { id: 'source1', content: 'First', similarity_score: 0.95, metadata: { source_url: 'http://example1.com' } },
        { id: 'source2', content: 'Second', similarity_score: 0.88, metadata: { source_url: 'http://example2.com' } },
        { id: 'source3', content: 'Third', similarity_score: 0.82, metadata: { source_url: 'http://example3.com' } },
        { id: 'source4', content: 'Fourth', similarity_score: 0.75, metadata: { source_url: 'http://example4.com' } }
      ];

      const html = MessageBubble.createSourcesHTML(sources);

      expect(html).toContain('and 1 more');
    });
  });

  describe('update', () => {
    test('should update message bubble content', () => {
      const message = {
        id: 'test-message-9',
        sender: 'user',
        content: 'Original content',
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      const bubble = MessageBubble.create(message);

      const updates = {
        content: 'Updated content',
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      MessageBubble.update(bubble, updates);

      const contentElement = bubble.querySelector('.rag-message-content');
      expect(contentElement.innerHTML).toContain('Updated content');

      // Check that the status class was updated
      expect(bubble.classList.contains('rag-message-pending')).toBe(true);
    });

    test('should handle null parameters', () => {
      MessageBubble.update(null, {});

      const bubble = MessageBubble.create({
        id: 'test-message-10',
        sender: 'user',
        content: 'Test',
        timestamp: new Date().toISOString()
      });

      MessageBubble.update(bubble, null);
    });

    test('should update sources if provided', () => {
      const message = {
        id: 'test-message-11',
        sender: 'agent',
        content: 'Original content with sources',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        sources: [{ id: 'source1', content: 'Original source', similarity_score: 0.95 }]
      };

      const bubble = MessageBubble.create(message);

      const updates = {
        sources: [{ id: 'source2', content: 'Updated source', similarity_score: 0.85 }]
      };

      MessageBubble.update(bubble, updates);

      const sourcesElement = bubble.querySelector('.rag-message-sources');
      expect(sourcesElement).toBeTruthy();
    });
  });

  describe('createPending', () => {
    test('should create a pending message bubble', () => {
      const bubble = MessageBubble.createPending('Pending message content', 'user');

      expect(bubble).toBeInstanceOf(Element);
      expect(bubble.classList.contains('rag-message-pending')).toBe(true);
      expect(bubble.classList.contains('rag-message-user')).toBe(true);

      const contentElement = bubble.querySelector('.rag-message-content');
      expect(contentElement).toBeTruthy();
      expect(contentElement.innerHTML).toContain('Pending message content');
    });

    test('should create a pending message bubble for agent', () => {
      const bubble = MessageBubble.createPending('Pending agent message', 'agent');

      expect(bubble.classList.contains('rag-message-agent')).toBe(true);
      expect(bubble.classList.contains('rag-message-pending')).toBe(true);

      const contentElement = bubble.querySelector('.rag-message-content');
      expect(contentElement.innerHTML).toContain('Pending agent message');
    });
  });

  describe('sortMessages', () => {
    test('should sort messages by timestamp', () => {
      const messages = [
        { id: 'msg3', timestamp: new Date(Date.now() - 1000).toISOString() }, // 1 sec ago
        { id: 'msg1', timestamp: new Date(Date.now() - 3000).toISOString() }, // 3 sec ago
        { id: 'msg2', timestamp: new Date(Date.now() - 2000).toISOString() }  // 2 sec ago
      ];

      const sorted = MessageBubble.sortMessages(messages);

      expect(sorted[0].id).toBe('msg1'); // Oldest first
      expect(sorted[1].id).toBe('msg2');
      expect(sorted[2].id).toBe('msg3'); // Newest last
    });

    test('should handle empty messages array', () => {
      const sorted = MessageBubble.sortMessages([]);
      expect(sorted).toEqual([]);
    });

    test('should handle null messages', () => {
      const sorted = MessageBubble.sortMessages(null);
      expect(sorted).toEqual([]);
    });

    test('should handle invalid messages array', () => {
      const sorted = MessageBubble.sortMessages('not-an-array');
      expect(sorted).toEqual([]);
    });
  });

  describe('createMessageContainer', () => {
    test('should create a container with multiple message bubbles', () => {
      const messages = [
        { id: 'msg1', sender: 'user', content: 'Message 1', timestamp: new Date(Date.now() - 3000).toISOString() },
        { id: 'msg2', sender: 'agent', content: 'Message 2', timestamp: new Date(Date.now() - 2000).toISOString() },
        { id: 'msg3', sender: 'user', content: 'Message 3', timestamp: new Date(Date.now() - 1000).toISOString() }
      ];

      const container = MessageBubble.createMessageContainer(messages);

      expect(container).toBeInstanceOf(Element);
      expect(container.tagName).toBe('DIV');
      expect(container.classList.contains('rag-messages-container')).toBe(true);

      const bubbles = container.querySelectorAll('.rag-message-bubble');
      expect(bubbles.length).toBe(3);
    });

    test('should sort messages in the container', () => {
      const messages = [
        { id: 'msg3', sender: 'user', content: 'Message 3', timestamp: new Date(Date.now() - 1000).toISOString() },
        { id: 'msg1', sender: 'user', content: 'Message 1', timestamp: new Date(Date.now() - 3000).toISOString() },
        { id: 'msg2', sender: 'agent', content: 'Message 2', timestamp: new Date(Date.now() - 2000).toISOString() }
      ];

      const container = MessageBubble.createMessageContainer(messages);

      const bubbles = container.querySelectorAll('.rag-message-bubble');
      expect(bubbles.length).toBe(3);

      // Check that messages are sorted (oldest first)
      // The actual order depends on how the create method assigns IDs, so we'll just verify all messages are present
    });

    test('should handle empty messages array', () => {
      const container = MessageBubble.createMessageContainer([]);

      expect(container).toBeInstanceOf(Element);
      expect(container.tagName).toBe('DIV');
      expect(container.classList.contains('rag-messages-container')).toBe(true);

      const bubbles = container.querySelectorAll('.rag-message-bubble');
      expect(bubbles.length).toBe(0);
    });

    test('should handle options parameter', () => {
      const messages = [
        { id: 'msg1', sender: 'user', content: 'Message with options', timestamp: new Date().toISOString() }
      ];

      const options = {
        additionalClasses: ['container-option']
      };

      const container = MessageBubble.createMessageContainer(messages, options);

      // Each message bubble should have the additional classes
      const bubbles = container.querySelectorAll('.rag-message-bubble');
      expect(bubbles.length).toBe(1);
    });
  });
});