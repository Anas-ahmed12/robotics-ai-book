# RAG Chatbot Frontend Component

A Retrieval-Augmented Generation (RAG) chatbot frontend component designed for the Robotics-AI Book. This component allows readers to ask questions about the book content and receive intelligent responses based on the book's information.

## Features

- Embedded chat interface for book pages
- Question submission with optional text selection as context
- Conversation history maintained per session
- Loading indicators and error handling
- Responsive design with blue/white theme
- Cross-browser compatibility

## Installation

1. Install dependencies: `npm install`
2. Build the component: `npm run build`
3. The bundled component will be available in the `dist/` directory

## Usage

Include the component in your HTML page:

```html
<div id="rag-chat-container"></div>
<script src="dist/chat-component.js"></script>
<script>
  RAGChatbot.init({
    containerId: 'rag-chat-container',
    backendUrl: 'http://your-backend-server.com/api/chat'
  });
</script>
```

## Development

1. Start development server: `npm run dev`
2. Run tests: `npm test`
3. Build for production: `npm run build`

## Technologies Used

- JavaScript/ES6+
- HTML5/CSS3
- OpenAI Agents/ChatKit SDK
- Webpack for bundling
- Jest for testing

## Architecture

The component follows a modular architecture with separate services for:
- API communication
- Session management
- Text selection
- UI components