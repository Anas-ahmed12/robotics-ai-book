/**
 * Unit tests for the InputArea component
 */

// Mock DOM environment
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test-container"></div></body></html>', {
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
    MAX_MESSAGE_LENGTH: 2000,
    MAX_SELECTED_TEXT_LENGTH: 1000
  },
  validators: {
    validateMessage: jest.fn()
  }
};

// Import the InputArea class
const InputArea = require('../../../src/components/InputArea');

describe('InputArea', () => {
  describe('create', () => {
    test('should create an input area with default options', () => {
      const result = InputArea.create();

      expect(result.container).toBeInstanceOf(HTMLElement);
      expect(result.input).toBeInstanceOf(HTMLTextAreaElement);
      expect(result.submitBtn).toBeInstanceOf(HTMLButtonElement);

      expect(result.container.classList.contains('rag-chat-input-container')).toBe(true);
      expect(result.input.classList.contains('rag-chat-input')).toBe(true);
      expect(result.submitBtn.classList.contains('rag-chat-submit-btn')).toBe(true);

      expect(result.input.placeholder).toBe('Ask a question about the book...');
      expect(result.input.rows).toBe(1);
      expect(result.submitBtn.textContent).toBe('Send');
      expect(result.submitBtn.disabled).toBe(true); // Initially disabled until user types
    });

    test('should create an input area with custom options', () => {
      const options = {
        placeholder: 'Custom placeholder text',
        rows: 2,
        maxRows: 5,
        onSend: jest.fn(),
        onInput: jest.fn(),
        enableTextSelection: false,
        disabled: true
      };

      const result = InputArea.create(options);

      expect(result.input.placeholder).toBe('Custom placeholder text');
      expect(result.input.rows).toBe(2);
      expect(result.input.disabled).toBe(true);
      expect(result.submitBtn.disabled).toBe(true);
    });

    test('should setup auto-resizing for the input area', () => {
      const result = InputArea.create({ maxRows: 3 });

      // Simulate typing content that would cause the textarea to grow
      result.input.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'; // Multiple lines
      const inputEvent = new Event('input', { bubbles: true });
      result.input.dispatchEvent(inputEvent);

      // Verify the height changed
      expect(result.input.style.height).not.toBe('auto');
    });

    test('should setup event listeners correctly', () => {
      const onSend = jest.fn();
      const onInput = jest.fn();

      const result = InputArea.create({
        onSend: onSend,
        onInput: onInput
      });

      // Type in the input
      result.input.value = 'Test message';
      const inputEvent = new Event('input', { bubbles: true });
      result.input.dispatchEvent(inputEvent);

      // Verify onInput callback was called
      expect(onInput).toHaveBeenCalledWith('Test message');

      // Enable the submit button by typing
      result.input.dispatchEvent(new Event('input', { bubbles: true }));

      // Click the submit button
      result.submitBtn.click();

      // Verify onSend callback was called
      expect(onSend).toHaveBeenCalledWith('Test message');
    });

    test('should handle Enter key submission', () => {
      const onSend = jest.fn();
      const result = InputArea.create({ onSend: onSend });

      // Set input value
      result.input.value = 'Test question for Enter key';
      result.input.dispatchEvent(new Event('input', { bubbles: true }));

      // Simulate Enter key press (without shift)
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false
      });
      result.input.dispatchEvent(enterEvent);

      // Verify onSend was called
      expect(onSend).toHaveBeenCalledWith('Test question for Enter key');
    });

    test('should handle Shift+Enter for new line instead of submission', () => {
      const onSend = jest.fn();
      const result = InputArea.create({ onSend: onSend });

      // Set input value
      result.input.value = 'Test question';
      result.input.dispatchEvent(new Event('input', { bubbles: true }));

      // Simulate Shift+Enter (should create new line, not submit)
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true
      });
      result.input.dispatchEvent(shiftEnterEvent);

      // Verify onSend was NOT called (since we used Shift+Enter)
      expect(onSend).not.toHaveBeenCalled();
    });

    test('should enable/disable submit button based on input', () => {
      const result = InputArea.create();

      // Initially disabled
      expect(result.submitBtn.disabled).toBe(true);

      // When input has text
      result.input.value = 'Test question';
      const inputEvent = new Event('input', { bubbles: true });
      result.input.dispatchEvent(inputEvent);

      expect(result.submitBtn.disabled).toBe(false);

      // When input is cleared
      result.input.value = '';
      result.input.dispatchEvent(inputEvent);

      expect(result.submitBtn.disabled).toBe(true);
    });

    test('should handle text selection events', () => {
      const onTextSelected = jest.fn();
      const result = InputArea.create({
        enableTextSelection: true,
        onTextSelected: onTextSelected
      });

      // Simulate text selection event
      const selectionDetails = {
        selectedText: 'Selected text from the book',
        sourceUrl: 'http://test-book/page1',
        timestamp: new Date().toISOString()
      };

      // This would be triggered by the text selection service in real implementation
      // For testing, we'll call the function directly if it exists
      if (result.handleTextSelection) {
        result.handleTextSelection(selectionDetails);
      }

      // Verify the callback was called
      expect(onTextSelected).toHaveBeenCalledWith(selectionDetails);
    });
  });

  describe('control methods', () => {
    test('should enable the input area', () => {
      const result = InputArea.create({ disabled: true });

      // Initially disabled
      expect(result.input.disabled).toBe(true);
      expect(result.submitBtn.disabled).toBe(true);

      // Enable
      result.enable();
      expect(result.input.disabled).toBe(false);
      expect(result.submitBtn.disabled).toBe(true); // Still disabled because input is empty
    });

    test('should disable the input area', () => {
      const result = InputArea.create();

      // Initially enabled
      expect(result.input.disabled).toBe(false);

      // Type something to enable submit button
      result.input.value = 'Test';
      result.input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(result.submitBtn.disabled).toBe(false);

      // Disable
      result.disable();
      expect(result.input.disabled).toBe(true);
      expect(result.submitBtn.disabled).toBe(true);
    });

    test('should clear the input area', () => {
      const result = InputArea.create();

      // Set some content
      result.input.value = 'Test content to clear';
      result.input.style.height = '100px';

      // Clear
      result.clear();
      expect(result.input.value).toBe('');
      expect(result.input.style.height).toBe('auto');
      expect(result.submitBtn.disabled).toBe(true);
    });

    test('should focus the input area', () => {
      const result = InputArea.create();

      // Mock focus method
      const focusSpy = jest.spyOn(result.input, 'focus');

      result.focus();

      expect(focusSpy).toHaveBeenCalled();
    });

    test('should set and get input value', () => {
      const result = InputArea.create();

      // Set value
      result.setValue('New test value');
      expect(result.getValue()).toBe('New test value');

      // Verify input event was triggered
      expect(result.submitBtn.disabled).toBe(false); // Should be enabled now
    });

    test('should add context to input', () => {
      const result = InputArea.create();

      // Add context text
      result.addContext('Context from selected text');

      expect(result.getValue()).toBe('Context from selected text');

      // Add more context to existing text
      result.setValue('Original question');
      result.addContext('Additional context');

      expect(result.getValue()).toBe('Additional context\n\nOriginal question');
    });

    test('should not add duplicate context', () => {
      const result = InputArea.create();

      // Add context text
      result.addContext('Unique context text');
      expect(result.getValue()).toBe('Unique context text');

      // Try to add the same context again
      result.addContext('Unique context text');

      // Should not duplicate
      expect(result.getValue()).toBe('Unique context text');
    });
  });

  describe('validation', () => {
    test('should validate input correctly', () => {
      const validation = InputArea.validateInput('Valid input text');

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeNull();
    });

    test('should invalidate empty input', () => {
      const validation = InputArea.validateInput('');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Input cannot be empty');
    });

    test('should invalidate non-string input', () => {
      const validation = InputArea.validateInput(123);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Input is required and must be a string');
    });

    test('should invalidate overly long input', () => {
      const longInput = 'A'.repeat(2001); // Exceeds default max of 2000
      const validation = InputArea.validateInput(longInput);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Input exceeds maximum length of 2000 characters');
    });

    test('should get value with validation', () => {
      const result = InputArea.create();
      result.setValue('Test value');

      const validation = InputArea.getValueWithValidation(result.input);

      expect(validation.value).toBe('Test value');
      expect(validation.validation.isValid).toBe(true);
      expect(validation.validation.error).toBeNull();
    });

    test('should handle validation for empty input', () => {
      const result = InputArea.create();
      result.setValue('');

      const validation = InputArea.getValueWithValidation(result.input);

      expect(validation.value).toBe('');
      expect(validation.validation.isValid).toBe(false);
      expect(validation.validation.error).toBe('Input cannot be empty');
    });

    test('should handle validation for null input element', () => {
      const validation = InputArea.getValueWithValidation(null);

      expect(validation.value).toBe('');
      expect(validation.validation.isValid).toBe(false);
      expect(validation.validation.error).toBe('Input is required and must be a string');
    });
  });

  describe('auto-resize functionality', () => {
    test('should resize input based on content', () => {
      const result = InputArea.create({ maxRows: 5 });

      // Set content that should cause expansion
      result.input.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7';
      const inputEvent = new Event('input', { bubbles: true });
      result.input.dispatchEvent(inputEvent);

      // Height should have increased but not exceeded max height
      expect(parseInt(result.input.style.height)).toBeGreaterThan(20); // Default textarea height
    });

    test('should respect max rows limit', () => {
      const result = InputArea.create({ maxRows: 2 });

      // Set content that would exceed max rows
      result.input.value = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10';
      const inputEvent = new Event('input', { bubbles: true });
      result.input.dispatchEvent(inputEvent);

      // Height should be capped at max rows equivalent
      const lineHeight = parseInt(window.getComputedStyle(result.input).lineHeight);
      const maxHeight = lineHeight * 2; // 2 rows max
      expect(parseInt(result.input.style.height)).toBeLessThanOrEqual(maxHeight);
    });
  });

  describe('edge cases', () => {
    test('should handle very long text gracefully', () => {
      const longText = 'A'.repeat(1500);
      const result = InputArea.create();

      result.setValue(longText);

      expect(result.getValue()).toBe(longText);
      expect(result.submitBtn.disabled).toBe(false);
    });

    test('should handle special characters', () => {
      const specialText = 'Question with special chars: <script>alert("test");</script> & symbols © ® ™';
      const result = InputArea.create();

      result.setValue(specialText);

      expect(result.getValue()).toBe(specialText);
    });

    test('should handle Unicode text', () => {
      const unicodeText = 'Unicode test: 🤖 Artificial Intelligence 📚 Book Question';
      const result = InputArea.create();

      result.setValue(unicodeText);

      expect(result.getValue()).toBe(unicodeText);
    });
  });
});