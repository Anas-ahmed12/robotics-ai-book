# RAG Chatbot Integration for Docusaurus Book

## Overview
The RAG (Retrieval-Augmented Generation) chatbot has been successfully integrated into the Docusaurus book UI. The chatbot appears as a floating widget on all pages and connects to the existing backend API.

## Features
- **Floating Chat Widget**: A chat button appears in the bottom-right corner of every page
- **Text Selection Integration**: Users can select text on the page and ask questions about the selected content
- **Backend Integration**: Connects to the existing FastAPI backend at `http://localhost:8000/api/v1/chat`
- **Session Management**: Maintains conversation context with a fixed session ID
- **Source Attribution**: Displays sources used by the RAG system in responses

## Implementation Details

### Files Created
1. `src/components/Chatbot/Chatbot.jsx` - Main React component
2. `src/components/Chatbot/Chatbot.css` - Styling for the chatbot
3. `src/components/Chatbot/index.js` - Export file for the component
4. `src/theme/Layout/index.js` - Layout wrapper to include chatbot on all pages

### Key Functionality
- **Text Selection**: Automatically detects when users select text on the page
- **API Communication**: Sends queries to `/api/v1/chat` endpoint with proper request/response handling
- **Loading States**: Shows typing indicators during API calls
- **Error Handling**: Gracefully handles API errors and network issues
- **Responsive Design**: Works on both desktop and mobile devices

## How to Run

### Prerequisites
- Node.js and npm for Docusaurus
- Python and required packages for the backend
- Qdrant database running for RAG functionality

### Running the System
1. **Start the Backend**:
   ```bash
   cd backend
   python -c "import sys; sys.path.append('.'); from src.api.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
   ```

2. **Start the Docusaurus Frontend**:
   ```bash
   npm start
   ```
   Or if port 3000 is busy:
   ```bash
   npx docusaurus start --port 3001
   ```

3. **Access the Application**:
   - Docusaurus UI: `http://localhost:3000` (or 3001)
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`

## Usage Instructions

1. **Opening the Chat**: Click the chat icon in the bottom-right corner
2. **Text Selection**: Select text on any page, then ask questions about it
3. **Asking Questions**: Type your question in the input field and press Enter or click send
4. **Viewing Sources**: Click "Sources" under bot responses to see retrieved documents
5. **Clearing Chat**: Use the clear button in the header to reset the conversation

## Architecture

The implementation follows these principles:
- **Single Frontend**: All UI runs within Docusaurus, no separate frontend server
- **Existing Backend**: Reuses the existing FastAPI RAG backend
- **Component-Based**: Modular React component that can be easily maintained
- **Non-Intrusive**: Doesn't affect existing Docusaurus functionality

## API Integration

The chatbot makes POST requests to `http://localhost:8000/api/v1/chat` with the following structure:
```json
{
  "query": "user question with selected text context if applicable",
  "session_id": "docusaurus-chat-session"
}
```

## Styling

The chatbot uses Tailwind-compatible CSS with:
- Floating action button design
- Clean chat interface with message bubbles
- Responsive layout for different screen sizes
- Smooth animations and transitions

## Error Handling

- Network errors are displayed in the chat interface
- API errors are caught and shown to the user
- Loading states prevent multiple simultaneous requests
- Graceful degradation when backend is unavailable