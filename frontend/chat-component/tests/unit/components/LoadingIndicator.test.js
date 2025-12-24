/**
 * Unit tests for the LoadingIndicator component
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
    LOADING_INDICATOR_DEFAULT_MESSAGE: 'Loading...'
  }
};

// Import the LoadingIndicator class
const LoadingIndicator = require('../../../src/components/LoadingIndicator');

describe('LoadingIndicator', () => {
  describe('create', () => {
    test('should create a loading indicator with default options', () => {
      const element = LoadingIndicator.create();

      expect(element).toBeInstanceOf(Element);
      expect(element.classList.contains('rag-loading-indicator')).toBe(true);
      expect(element.classList.contains('rag-loading-medium')).toBe(true);
      expect(element.classList.contains('rag-loading-theme-default')).toBe(true);

      const contentWrapper = element.querySelector('.rag-loading-content');
      expect(contentWrapper).toBeTruthy();

      const spinner = element.querySelector('.rag-loading-spinner');
      expect(spinner).toBeTruthy();

      const message = element.querySelector('.rag-loading-message');
      expect(message).toBeTruthy();
      expect(message.textContent).toBe('Thinking...');
    });

    test('should create a loading indicator with custom options', () => {
      const options = {
        message: 'Custom loading message',
        size: 'large',
        theme: 'primary',
        showSpinner: true,
        showText: true
      };

      const element = LoadingIndicator.create(options);

      expect(element.classList.contains('rag-loading-large')).toBe(true);
      expect(element.classList.contains('rag-loading-theme-primary')).toBe(true);

      const message = element.querySelector('.rag-loading-message');
      expect(message.textContent).toBe('Custom loading message');
    });

    test('should create a loading indicator without spinner', () => {
      const options = {
        showSpinner: false
      };

      const element = LoadingIndicator.create(options);

      const spinner = element.querySelector('.rag-loading-spinner');
      expect(spinner).toBeNull();

      const contentWrapper = element.querySelector('.rag-loading-content');
      expect(contentWrapper).toBeTruthy();
    });

    test('should create a loading indicator without text', () => {
      const options = {
        showText: false
      };

      const element = LoadingIndicator.create(options);

      const message = element.querySelector('.rag-loading-message');
      expect(message).toBeNull();

      const spinner = element.querySelector('.rag-loading-spinner');
      expect(spinner).toBeTruthy();
    });

    test('should create a loading indicator with both spinner and text hidden', () => {
      const options = {
        showSpinner: false,
        showText: false
      };

      const element = LoadingIndicator.create(options);

      const spinner = element.querySelector('.rag-loading-spinner');
      expect(spinner).toBeNull();

      const message = element.querySelector('.rag-loading-message');
      expect(message).toBeNull();

      const contentWrapper = element.querySelector('.rag-loading-content');
      expect(contentWrapper).toBeTruthy();
    });
  });

  describe('showTemporary', () => {
    test('should show a temporary loading indicator in a container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const removeFn = LoadingIndicator.showTemporary(container, {
        message: 'Temporary loading...'
      });

      expect(container.querySelector('.rag-loading-indicator')).toBeTruthy();
      expect(container.textContent).toContain('Temporary loading...');

      // Call the remove function
      removeFn();

      expect(container.querySelector('.rag-loading-indicator')).toBeNull();
    });

    test('should return a function to remove the loading indicator', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const removeFn = LoadingIndicator.showTemporary(container);

      expect(typeof removeFn).toBe('function');

      // Verify element was added
      expect(container.querySelector('.rag-loading-indicator')).toBeTruthy();

      // Call the remove function
      removeFn();

      // Verify element was removed
      expect(container.querySelector('.rag-loading-indicator')).toBeNull();
    });

    test('should handle invalid container', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const removeFn = LoadingIndicator.showTemporary(null);

      expect(removeFn).toEqual(expect.any(Function)); // Should still return a function
      expect(consoleSpy).toHaveBeenCalledWith('Container not provided to LoadingIndicator.showTemporary');
      consoleSpy.mockRestore();
    });
  });

  describe('show', () => {
    test('should show a loading indicator in a container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const element = LoadingIndicator.show(container, {
        message: 'Loading...'
      });

      expect(element).toBeInstanceOf(Element);
      expect(container.querySelector('.rag-loading-indicator')).toBe(element);
      expect(container.textContent).toContain('Loading...');
    });

    test('should handle invalid container', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const element = LoadingIndicator.show(null);

      expect(element).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Container not provided to LoadingIndicator.show');
      consoleSpy.mockRestore();
    });
  });

  describe('hide', () => {
    test('should hide a loading indicator', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Add a loading indicator to the container
      const element = LoadingIndicator.show(container);

      expect(container.querySelector('.rag-loading-indicator')).toBe(element);

      // Hide the loading indicator
      LoadingIndicator.hide(element);

      expect(container.querySelector('.rag-loading-indicator')).toBeNull();
    });

    test('should handle hiding a loading indicator that is not in DOM', () => {
      const element = LoadingIndicator.create();

      // The element is not in the DOM yet
      LoadingIndicator.hide(element);

      // Should not throw an error
    });

    test('should handle invalid loading element', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LoadingIndicator.hide(null);

      expect(consoleSpy).toHaveBeenCalledWith('Loading element not provided to LoadingIndicator.hide');
      consoleSpy.mockRestore();
    });
  });

  describe('updateMessage', () => {
    test('should update the message of a loading indicator', () => {
      const element = LoadingIndicator.create({
        message: 'Initial message'
      });

      LoadingIndicator.updateMessage(element, 'Updated message');

      const messageElement = element.querySelector('.rag-loading-message');
      expect(messageElement.textContent).toBe('Updated message');
    });

    test('should handle invalid loading element', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LoadingIndicator.updateMessage(null, 'New message');

      expect(consoleSpy).toHaveBeenCalledWith('Loading element not provided to LoadingIndicator.updateMessage');
      consoleSpy.mockRestore();
    });

    test('should handle loading element without message element', () => {
      // Create a custom element without the message class
      const element = document.createElement('div');
      element.innerHTML = '<div class="other-class">Content</div>';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      LoadingIndicator.updateMessage(element, 'New message');

      // Should not throw an error, just not update anything
      consoleSpy.mockRestore();
    });
  });

  describe('size variations', () => {
    test('should create small loading indicator', () => {
      const element = LoadingIndicator.create({ size: 'small' });
      expect(element.classList.contains('rag-loading-small')).toBe(true);
    });

    test('should create medium loading indicator', () => {
      const element = LoadingIndicator.create({ size: 'medium' });
      expect(element.classList.contains('rag-loading-medium')).toBe(true);
    });

    test('should create large loading indicator', () => {
      const element = LoadingIndicator.create({ size: 'large' });
      expect(element.classList.contains('rag-loading-large')).toBe(true);
    });

    test('should default to medium size', () => {
      const element = LoadingIndicator.create({});
      expect(element.classList.contains('rag-loading-medium')).toBe(true);
    });
  });

  describe('theme variations', () => {
    test('should create default theme loading indicator', () => {
      const element = LoadingIndicator.create({ theme: 'default' });
      expect(element.classList.contains('rag-loading-theme-default')).toBe(true);
    });

    test('should create primary theme loading indicator', () => {
      const element = LoadingIndicator.create({ theme: 'primary' });
      expect(element.classList.contains('rag-loading-theme-primary')).toBe(true);
    });

    test('should create secondary theme loading indicator', () => {
      const element = LoadingIndicator.create({ theme: 'secondary' });
      expect(element.classList.contains('rag-loading-theme-secondary')).toBe(true);
    });

    test('should default to default theme', () => {
      const element = LoadingIndicator.create({});
      expect(element.classList.contains('rag-loading-theme-default')).toBe(true);
    });
  });

  describe('animation frame handling', () => {
    test('should handle loading indicators with different durations', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Show temporary loading indicator
      const removeFn = LoadingIndicator.showTemporary(container, {
        message: 'Temporary indicator'
      });

      // Verify it was added
      expect(container.querySelector('.rag-loading-indicator')).toBeTruthy();

      // Call remove function after a delay
      setTimeout(() => {
        removeFn();
        expect(container.querySelector('.rag-loading-indicator')).toBeNull();
      }, 100);
    });
  });

  describe('DOM element properties', () => {
    test('should set appropriate ARIA attributes', () => {
      const element = LoadingIndicator.create({
        message: 'Loading content'
      });

      expect(element.getAttribute('role')).toBe('status');
      expect(element.getAttribute('aria-live')).toBe('polite');
    });

    test('should have proper semantic structure', () => {
      const element = LoadingIndicator.create();

      const contentWrapper = element.querySelector('.rag-loading-content');
      expect(contentWrapper).toBeTruthy();

      const spinner = element.querySelector('.rag-loading-spinner');
      expect(spinner).toBeTruthy();

      const message = element.querySelector('.rag-loading-message');
      expect(message).toBeTruthy();
    });
  });
});