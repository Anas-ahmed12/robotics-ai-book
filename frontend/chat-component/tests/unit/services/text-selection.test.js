/**
 * Unit tests for the text selection service
 */

// Mock the window.getSelection API
const mockSelection = {
  toString: () => 'Selected text',
  rangeCount: 1,
  getRangeAt: (index) => ({
    startOffset: 10,
    endOffset: 20,
    commonAncestorContainer: {
      parentElement: {
        id: 'test-element',
        className: 'test-class'
      }
    }
  }),
  anchorOffset: 10,
  focusOffset: 20
};

global.window = {
  getSelection: () => mockSelection,
  location: {
    href: 'http://test-page.com'
  },
  document: {
    selection: null
  },
  RAGChatbot: {
    constants: {
      MAX_SELECTED_TEXT_LENGTH: 1000
    }
  }
};

global.document = {
  selection: null
};

// Import the text selection service
const TextSelection = require('../../../src/services/text-selection');

describe('TextSelection', () => {
  describe('getSelectedText', () => {
    test('should return selected text using window.getSelection', () => {
      const selectedText = TextSelection.getSelectedText();
      expect(selectedText).toBe('Selected text');
    });

    test('should return empty string when no text is selected', () => {
      // Mock empty selection
      global.window.getSelection = () => ({ toString: () => '' });

      const selectedText = TextSelection.getSelectedText();
      expect(selectedText).toBe('');
    });
  });

  describe('getSelectionDetails', () => {
    test('should return selection details when text is selected', () => {
      const details = TextSelection.getSelectionDetails();

      expect(details).toEqual({
        selectedText: 'Selected text',
        sourceUrl: 'http://test-page.com',
        timestamp: expect.any(String),
        selectionStartOffset: 10,
        selectionEndOffset: 20,
        containerId: 'test-element',
        containerClass: 'test-class'
      });
    });

    test('should return null when no text is selected', () => {
      // Mock empty selection
      global.window.getSelection = () => ({ toString: () => '', rangeCount: 0 });

      const details = TextSelection.getSelectionDetails();
      expect(details).toBeNull();
    });

    test('should handle cases where selection.toString does not match selected text', () => {
      // Mock a selection where toString doesn't match
      global.window.getSelection = () => ({
        toString: () => 'different text',
        rangeCount: 0
      });

      const details = TextSelection.getSelectionDetails();
      expect(details).toEqual({
        selectedText: 'different text',
        sourceUrl: 'http://test-page.com',
        timestamp: expect.any(String)
      });
    });
  });

  describe('validateSelection', () => {
    test('should return valid for proper selection', () => {
      const validation = TextSelection.validateSelection('Valid text');
      expect(validation).toEqual({
        isValid: true,
        error: null
      });
    });

    test('should return invalid for empty selection', () => {
      const validation = TextSelection.validateSelection('');
      expect(validation).toEqual({
        isValid: false,
        error: 'No text selected'
      });
    });

    test('should return invalid for non-string selection', () => {
      const validation = TextSelection.validateSelection(123);
      expect(validation).toEqual({
        isValid: false,
        error: 'Selected text must be a string'
      });
    });

    test('should return invalid for text that exceeds max length', () => {
      const longText = 'A'.repeat(1001); // Exceeds default max of 1000
      const validation = TextSelection.validateSelection(longText);
      expect(validation).toEqual({
        isValid: false,
        error: 'Selected text exceeds maximum length of 1000 characters'
      });
    });
  });

  describe('setupSelectionListener', () => {
    test('should set up event listeners and return removal function', () => {
      const callback = jest.fn();
      const removeListeners = TextSelection.setupSelectionListener(callback);

      // Check that the function returns a function to remove listeners
      expect(typeof removeListeners).toBe('function');

      // Cleanup
      removeListeners();
    });

    test('should call callback when text is selected', () => {
      const callback = jest.fn();
      const removeListeners = TextSelection.setupSelectionListener(callback);

      // Simulate selection event
      const event = new Event('mouseup');
      document.dispatchEvent(event);

      // Wait for debounce timeout
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
          selectedText: 'Selected text'
        }));
      }, 200);

      // Cleanup
      removeListeners();
    });
  });

  describe('highlightText', () => {
    test('should log text selection highlight feature', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      TextSelection.highlightText('test text');

      expect(consoleSpy).toHaveBeenCalledWith('Text selection highlight feature - text:', 'test text');
      consoleSpy.mockRestore();
    });
  });

  describe('clearSelection', () => {
    test('should clear selection using window.getSelection', () => {
      const removeAllRanges = jest.fn();
      global.window.getSelection = () => ({ removeAllRanges });

      TextSelection.clearSelection();

      expect(removeAllRanges).toHaveBeenCalled();
    });

    test('should handle document.selection in IE', () => {
      // Mock IE selection
      global.window.getSelection = null;
      global.document.selection = { empty: jest.fn() };

      TextSelection.clearSelection();

      expect(global.document.selection.empty).toHaveBeenCalled();
    });
  });

  describe('prepareContextForApi', () => {
    test('should prepare context for API when selection details are valid', () => {
      const selectionDetails = {
        selectedText: 'Test selected text',
        sourceUrl: 'http://test-page.com',
        timestamp: new Date().toISOString(),
        containerId: 'test-container',
        containerClass: 'test-class',
        selectionStartOffset: 10,
        selectionEndOffset: 20
      };

      const context = TextSelection.prepareContextForApi(selectionDetails);

      expect(context).toEqual({
        selected_text: 'Test selected text',
        source_url: 'http://test-page.com',
        timestamp: selectionDetails.timestamp,
        container_id: 'test-container',
        container_class: 'test-class',
        selection_start_offset: 10,
        selection_end_offset: 20
      });
    });

    test('should return null when selection details are invalid', () => {
      const context = TextSelection.prepareContextForApi(null);
      expect(context).toBeNull();
    });

    test('should return null when selection text is invalid', () => {
      const context = TextSelection.prepareContextForApi({ selectedText: '' });
      expect(context).toBeNull();
    });

    test('should handle selection details with missing optional properties', () => {
      const selectionDetails = {
        selectedText: 'Test selected text',
        sourceUrl: 'http://test-page.com',
        timestamp: new Date().toISOString()
      };

      const context = TextSelection.prepareContextForApi(selectionDetails);

      expect(context).toEqual({
        selected_text: 'Test selected text',
        source_url: 'http://test-page.com',
        timestamp: selectionDetails.timestamp
      });
    });

    test('should return null when validation fails', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const selectionDetails = {
        selectedText: 'Too long text'.repeat(100), // Too long
        sourceUrl: 'http://test-page.com',
        timestamp: new Date().toISOString()
      };

      const context = TextSelection.prepareContextForApi(selectionDetails);

      expect(context).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Text selection validation failed:', 'Selected text exceeds maximum length of 1000 characters');
      consoleSpy.mockRestore();
    });
  });
});