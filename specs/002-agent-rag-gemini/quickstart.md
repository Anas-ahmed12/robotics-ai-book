# Quickstart Guide: Agent-Based RAG Chatbot with Google Gemini

## Overview
This guide will help you quickly set up and run the agent-based RAG chatbot using Google Gemini as the LLM backend. The system implements OpenAI SDK-compatible agent abstractions with Qdrant vector database integration.

## Prerequisites
- Python 3.11 or higher
- pip package manager
- Google Gemini API key
- Access to Qdrant vector database (from Spec-1)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd robotics-ai-book
git checkout 002-agent-rag-gemini
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
# Or install specific packages:
pip install fastapi google-generativeai qdrant-client pydantic structlog python-dotenv uvicorn
```

### 4. Configure Environment Variables
Create a `.env` file in the project root with the following variables:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
QDRANT_HOST=your_qdrant_host
QDRANT_PORT=6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=robotics_book_embeddings
LOG_LEVEL=INFO
```

### 5. Verify Qdrant Connection
Ensure that your Qdrant vector database from Spec-1 is accessible and contains the required embeddings.

## Running the Service

### 1. Start the FastAPI Server
```bash
uvicorn backend-agent-rag.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Verify Service is Running
Open your browser to `http://localhost:8000/docs` to access the API documentation.

## Basic Usage Examples

### 1. Send a Query to the Agent
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain how ROS 2 differs from ROS 1 in robotics development",
    "timeout": 60
  }'
```

### 2. Create a Session for Contextual Conversations
```bash
curl -X POST "http://localhost:8000/api/v1/chat/session" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Continue a Conversation with Session ID
```bash
curl -X POST "http://localhost:8000/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What did I ask about earlier?",
    "session_id": "your-session-id-from-previous-call",
    "timeout": 60
  }'
```

## Agent Architecture Overview

The system implements the following architecture:

1. **Agent Abstraction**: OpenAI SDK-compatible agent that manages reasoning
2. **Retrieval Tool**: Qdrant-based tool that the agent can call to retrieve relevant documents
3. **Google Gemini Integration**: LLM backend accessed through an adapter pattern
4. **Session Management**: Conversation state management for multi-turn interactions
5. **Structured Logging**: Comprehensive logging using structlog

## Key Endpoints

- `POST /api/v1/chat`: Main endpoint for sending queries to the agent
- `POST /api/v1/chat/session`: Create new conversation sessions
- `GET /api/v1/chat/session/{session_id}`: Get session details
- `GET /api/v1/health`: Health check endpoint

## Configuration Options

### Timeout Settings
- `AGENT_MAX_EXECUTION_TIME`: Maximum time for agent execution (default: 60 seconds)
- `TOOL_CALL_TIMEOUT`: Maximum time for individual tool calls (default: 30 seconds)

### Logging
- Set `LOG_LEVEL` environment variable to `DEBUG`, `INFO`, `WARNING`, or `ERROR`
- Structured logs are output in JSON format

## Troubleshooting

### Common Issues

1. **Gemini API Connection Errors**
   - Verify your `GEMINI_API_KEY` is correct and has proper permissions
   - Check internet connectivity to Google's API servers

2. **Qdrant Connection Issues**
   - Ensure Qdrant server is running and accessible
   - Verify `QDRANT_HOST`, `QDRANT_PORT`, and `QDRANT_API_KEY` settings

3. **Retrieval Tool Not Working**
   - Confirm the collection name matches your Qdrant setup
   - Verify that embeddings exist in the database

### Enable Debug Logging
Set `LOG_LEVEL=DEBUG` in your environment to get more detailed logs for troubleshooting.

## Next Steps

1. Integrate with your frontend application
2. Add authentication to the API endpoints
3. Implement rate limiting for production use
4. Set up monitoring and alerting
5. Run integration tests to validate the full RAG flow