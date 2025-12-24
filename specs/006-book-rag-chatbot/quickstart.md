# Quickstart Guide: RAG Chatbot Frontend Component

## Overview
This guide provides instructions for integrating and using the RAG chatbot frontend component with the robotics-AI book.

## Prerequisites
- Web server hosting the book (Docusaurus or plain HTML/JS environment)
- Access to the backend API at `/api/chat` (from Spec-3 implementation)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Include the Chat Component
Add the following to your HTML pages where you want the chat interface:

```html
<!-- Include the chat component CSS -->
<link rel="stylesheet" href="/path/to/chat-component/dist/chat-component.css">

<!-- Include the chat component JavaScript -->
<script src="/path/to/chat-component/dist/chat-component.js"></script>

<!-- Add the chat container to your page -->
<div id="rag-chatbot-container"></div>

<!-- Initialize the chat component -->
<script>
  // Initialize the chat component when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof RAGChatbot !== 'undefined') {
      RAGChatbot.init({
        containerId: 'rag-chatbot-container',
        backendUrl: 'http://your-backend-server.com/api/chat', // Update with your backend URL
        theme: 'blue-white' // or 'dark-mode', defaults to 'blue-white'
      });
    }
  });
</script>
```

### 2. Configure Backend Connection
Update the `backendUrl` parameter to point to your running backend service that implements the `/api/chat` endpoint from Spec-3.

## Usage

### Basic Usage
Once initialized, the chat component will:
- Display a chat interface embedded in the specified container
- Allow users to type questions in the input area
- Enable text selection from the book content to include as context
- Show loading indicators while processing requests
- Display responses with proper formatting

### Text Selection Feature
Users can select text from the book content, and the chat component will:
- Detect the text selection automatically
- Offer an option to include the selected text as context
- Send the selected text along with the user's question to the backend

### Session Management
- Conversation history is maintained within the user's browser session
- History persists across page navigation within the book
- Sessions expire when the browser tab is closed (uses sessionStorage)

## Configuration Options

### Initialization Parameters
```javascript
RAGChatbot.init({
  containerId: 'rag-chatbot-container',      // ID of the container element
  backendUrl: 'http://your-server/api/chat', // Backend API endpoint
  theme: 'blue-white',                       // Theme: 'blue-white' or 'dark-mode'
  maxHistory: 50,                           // Maximum messages to store
  enableTextSelection: true,                // Enable/disable text selection feature
  defaultOpen: false                        // Whether chat is open by default
});
```

## Development

### Building from Source
1. Navigate to the chat component directory
2. Install dependencies: `npm install` (if using npm-based build)
3. Build the component: `npm run build`
4. The built files will be in the `dist/` directory

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Chat interface not appearing**
   - Verify the container element exists in the DOM
   - Check browser console for JavaScript errors
   - Ensure the component files are properly loaded

2. **Backend connection errors**
   - Verify the backend URL is correct
   - Check CORS settings on the backend server
   - Confirm the `/api/chat` endpoint is accessible

3. **Text selection not working**
   - Ensure the book content allows text selection
   - Check browser console for JavaScript errors related to selection

### Error Handling
- Network errors are displayed with user-friendly messages
- Backend timeouts show appropriate loading indicators
- Invalid inputs are validated before sending to backend