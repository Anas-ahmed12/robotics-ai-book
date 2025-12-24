/**
 * Unit tests for the ErrorDisplay component
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
    ERROR_DISPLAY_DEFAULT_TYPE: 'general',
    ERROR_DISPLAY_DEFAULT_DURATION: 5000,
    ERROR_DISPLAY_TYPES: {
      GENERAL: 'general',
      NETWORK: 'network',
      VALIDATION: 'validation',
      TIMEOUT: 'timeout'
    }
  }
};

// Import the ErrorDisplay class
const ErrorDisplay = require('../../../src/components/ErrorDisplay');

describe('ErrorDisplay', () => {
  describe('create', () => {
    test('should create an error message element with default options', () => {
      const element = ErrorDisplay.create('Default error message');

      expect(element).toBeInstanceOf(Element);
      expect(element.classList.contains('rag-error-display')).toBe(true);
      expect(element.classList.contains('rag-error-type-general')).toBe(true);
      expect(element.getAttribute('role')).toBe('alert');
      expect(element.getAttribute('aria-live')).toBe('assertive');

      const contentWrapper = element.querySelector('.rag-error-content');
      expect(contentWrapper).toBeTruthy();

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe('Default error message');

      const icon = element.querySelector('.rag-error-icon');
      expect(icon).toBeTruthy();

      const closeButton = element.querySelector('.rag-error-close-btn');
      expect(closeButton).toBeTruthy();
    });

    test('should create an error message element with custom options', () => {
      const options = {
        type: 'network',
        duration: 3000,
        closable: false,
        onDismiss: jest.fn(),
        showIcon: false
      };

      const element = ErrorDisplay.create('Custom error message', options);

      expect(element.classList.contains('rag-error-type-network')).toBe(true);
      expect(element.classList.contains('rag-error-type-general')).toBe(false);

      const icon = element.querySelector('.rag-error-icon');
      expect(icon).toBeNull(); // Icon should not be shown

      const closeButton = element.querySelector('.rag-error-close-btn');
      expect(closeButton).toBeNull(); // Close button should not be shown since closable is false
    });

    test('should handle error object instead of string', () => {
      const errorObj = {
        message: 'Error from object',
        detail: 'Additional detail',
        code: 'ERR_CODE'
      };

      const element = ErrorDisplay.create(errorObj);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe('Error from object');
    });

    test('should handle error object with detail property', () => {
      const errorObj = {
        detail: 'Error detail message',
        code: 'ERR_CODE'
      };

      const element = ErrorDisplay.create(errorObj);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe('Error detail message');
    });

    test('should handle error object with no message or detail', () => {
      const errorObj = {
        code: 'ERR_CODE'
      };

      const element = ErrorDisplay.create(errorObj);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe(JSON.stringify(errorObj));
    });

    test('should handle non-object error', () => {
      const element = ErrorDisplay.create(123);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe('An unknown error occurred');
    });

    test('should handle null error', () => {
      const element = ErrorDisplay.create(null);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent).toBe('An unknown error occurred');
    });
  });

  describe('show', () => {
    test('should show an error message in a container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const element = ErrorDisplay.show(container, 'Test error message');

      expect(element).toBeInstanceOf(Element);
      expect(container.querySelector('.rag-error-display')).toBe(element);
      expect(container.textContent).toContain('Test error message');
    });

    test('should handle invalid container', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const element = ErrorDisplay.show(null, 'Test error message');

      expect(element).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Container not provided to ErrorDisplay.show');
      consoleSpy.mockRestore();
    });

    test('should show error with custom options', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const element = ErrorDisplay.show(container, 'Custom error', {
        type: 'validation',
        closable: false
      });

      expect(element.classList.contains('rag-error-type-validation')).toBe(true);
      const closeButton = element.querySelector('.rag-error-close-btn');
      expect(closeButton).toBeNull(); // Should not be closable
    });
  });

  describe('showTemporary', () => {
    test('should show a temporary error message in a container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const removeFn = ErrorDisplay.showTemporary(container, 'Temporary error message', {
        duration: 100
      });

      expect(typeof removeFn).toBe('function');
      expect(container.textContent).toContain('Temporary error message');

      // Wait for the duration to pass and verify the element is removed
      setTimeout(() => {
        expect(container.querySelector('.rag-error-display')).toBeNull();
      }, 150); // Slightly longer than duration
    });

    test('should return a function to remove the error message', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const removeFn = ErrorDisplay.showTemporary(container, 'Temporary error message');

      expect(typeof removeFn).toBe('function');

      // Verify element was added
      expect(container.querySelector('.rag-error-display')).toBeTruthy();

      // Call the remove function
      removeFn();

      // Verify element was removed
      expect(container.querySelector('.rag-error-display')).toBeNull();
    });

    test('should handle invalid container', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const removeFn = ErrorDisplay.showTemporary(null, 'Temporary error message');

      expect(removeFn).toEqual(expect.any(Function)); // Should still return a function
      expect(consoleSpy).toHaveBeenCalledWith('Container not provided to ErrorDisplay.showTemporary');
      consoleSpy.mockRestore();
    });

    test('should use default duration if not specified', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const removeFn = ErrorDisplay.showTemporary(container, 'Temporary error message');

      expect(typeof removeFn).toBe('function');
      expect(container.querySelector('.rag-error-display')).toBeTruthy();
    });
  });

  describe('dismiss', () => {
    test('should dismiss an error message', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const element = ErrorDisplay.show(container, 'Dismissible error');

      expect(container.querySelector('.rag-error-display')).toBe(element);

      ErrorDisplay.dismiss(element);

      expect(container.querySelector('.rag-error-display')).toBeNull();
    });

    test('should handle dismissing an error element not in DOM', () => {
      const element = ErrorDisplay.create('Test error');

      // Element is not in DOM yet
      ErrorDisplay.dismiss(element);

      // Should not throw an error
    });

    test('should handle invalid error element', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      ErrorDisplay.dismiss(null);

      expect(consoleSpy).toHaveBeenCalledWith('Error element not provided to ErrorDisplay.dismiss');
      consoleSpy.mockRestore();
    });
  });

  describe('createNetworkError', () => {
    test('should create a network error display', () => {
      const element = ErrorDisplay.createNetworkError('Network error occurred');

      expect(element.classList.contains('rag-error-type-network')).toBe(true);
      expect(element.classList.contains('rag-error-type-general')).toBe(false);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement.textContent).toBe('Network error occurred');
    });

    test('should create a network error with custom options', () => {
      const element = ErrorDisplay.createNetworkError('Network error', {
        duration: 2000
      });

      expect(element.classList.contains('rag-error-type-network')).toBe(true);
    });
  });

  describe('createValidationError', () => {
    test('should create a validation error display', () => {
      const element = ErrorDisplay.createValidationError('Validation failed');

      expect(element.classList.contains('rag-error-type-validation')).toBe(true);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement.textContent).toBe('Validation failed');
    });
  });

  describe('createTimeoutError', () => {
    test('should create a timeout error display', () => {
      const element = ErrorDisplay.createTimeoutError('Request timed out');

      expect(element.classList.contains('rag-error-type-timeout')).toBe(true);

      const messageElement = element.querySelector('.rag-error-message');
      expect(messageElement.textContent).toBe('Request timed out');
    });
  });

  describe('showMultipleErrors', () => {
    test('should display multiple errors in a container', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const errors = [
        'First error',
        'Second error',
        {
          message: 'Third error'
        }
      ];

      const elements = ErrorDisplay.showMultipleErrors(container, errors);

      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBe(3);

      const allErrorDisplays = container.querySelectorAll('.rag-error-display');
      expect(allErrorDisplays.length).toBe(3);

      expect(allErrorDisplays[0].textContent).toContain('First error');
      expect(allErrorDisplays[1].textContent).toContain('Second error');
      expect(allErrorDisplays[2].textContent).toContain('Third error');
    });

    test('should handle empty errors array', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const elements = ErrorDisplay.showMultipleErrors(container, []);

      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBe(0);

      const allErrorDisplays = container.querySelectorAll('.rag-error-display');
      expect(allErrorDisplays.length).toBe(0);
    });

    test('should handle invalid parameters', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const elements = ErrorDisplay.showMultipleErrors(null, []);

      expect(elements).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters provided to ErrorDisplay.showMultipleErrors');
      consoleSpy.mockRestore();
    });

    test('should handle non-array errors parameter', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const elements = ErrorDisplay.showMultipleErrors(container, 'not-an-array');

      expect(elements).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid parameters provided to ErrorDisplay.showMultipleErrors');
      consoleSpy.mockRestore();
    });
  });

  describe('close button functionality', () => {
    test('should dismiss error when close button is clicked', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const element = ErrorDisplay.show(container, 'Closable error');

      expect(container.querySelector('.rag-error-display')).toBe(element);

      const closeButton = element.querySelector('.rag-error-close-btn');
      expect(closeButton).toBeTruthy();

      // Simulate click on close button
      closeButton.click();

      expect(container.querySelector('.rag-error-display')).toBeNull();
    });

    test('should call onDismiss callback when error is dismissed via close button', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const onDismissMock = jest.fn();
      const element = ErrorDisplay.show(container, 'Closable error', {
        onDismiss: onDismissMock
      });

      const closeButton = element.querySelector('.rag-error-close-btn');
      closeButton.click();

      expect(onDismissMock).toHaveBeenCalled();
    });
  });

  describe('DOM element properties', () => {
    test('should set appropriate ARIA attributes', () => {
      const element = ErrorDisplay.create('Test error');

      expect(element.getAttribute('role')).toBe('alert');
      expect(element.getAttribute('aria-live')).toBe('assertive');
    });

    test('should have proper semantic structure', () => {
      const element = ErrorDisplay.create('Test error');

      const contentWrapper = element.querySelector('.rag-error-content');
      expect(contentWrapper).toBeTruthy();

      const message = element.querySelector('.rag-error-message');
      expect(message).toBeTruthy();

      const icon = element.querySelector('.rag-error-icon');
      expect(icon).toBeTruthy();

      const closeButton = element.querySelector('.rag-error-close-btn');
      expect(closeButton).toBeTruthy();
    });
  });

  describe('type variations', () => {
    test('should create different error type classes', () => {
      const generalError = ErrorDisplay.create('General error', { type: 'general' });
      expect(generalError.classList.contains('rag-error-type-general')).toBe(true);

      const networkError = ErrorDisplay.create('Network error', { type: 'network' });
      expect(networkError.classList.contains('rag-error-type-network')).toBe(true);

      const validationError = ErrorDisplay.create('Validation error', { type: 'validation' });
      expect(validationError.classList.contains('rag-error-type-validation')).toBe(true);

      const timeoutError = ErrorDisplay.create('Timeout error', { type: 'timeout' });
      expect(timeoutError.classList.contains('rag-error-type-timeout')).toBe(true);
    });
  });
});