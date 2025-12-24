# Knowledge Base Chatbot API

This is a FastAPI-based chatbot service that uses RAG (Retrieval-Augmented Generation) to answer questions based on a knowledge base stored in Qdrant vector database. The system integrates with OpenAI's API to generate contextual responses based on retrieved information.

## Features

- Query knowledge base with natural language
- FastAPI endpoints with automatic OpenAPI documentation
- Qdrant vector database integration for semantic search
- OpenAI-powered response generation
- Comprehensive error handling and logging
- Health check endpoints
- Support for conversation context

## Prerequisites

- Python 3.11+
- OpenAI API key
- Qdrant vector database (local or remote)

## Setup

1. Clone the repository
2. Navigate to the backend directory
3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # For development/testing
   ```
5. Create a `.env` file with the required environment variables (see Environment Variables below)

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=your_qdrant_api_key  # if authentication required
QDRANT_COLLECTION_NAME=robotics_kb
DEBUG=true
LOG_LEVEL=INFO
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
```

## Running the Application

### Direct execution:
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Using Docker:
```bash
docker-compose up --build
```

## API Endpoints

- `POST /api/v1/chat` - Process user queries and return responses
- `GET /api/v1/health` - Health check endpoint
- `GET /api/v1/ready` - Readiness check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation (ReDoc)

## Usage Examples

### Query the chatbot:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the fundamental principles of robotics?",
    "session_id": "sess_123456789",
    "temperature": 0.7
  }'
```

### Check health:
```bash
curl -X GET http://localhost:8000/api/v1/health
```

### Check readiness:
```bash
curl -X GET http://localhost:8000/api/v1/ready
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Chat endpoint: 10 requests per minute per IP address
- Exceeding the limit returns a 429 status code

## Configuration

The application can be configured through environment variables in the `.env` file:
- `OPENAI_API_KEY`: Your OpenAI API key for generating responses
- `QDRANT_HOST`: Host address for your Qdrant instance
- `QDRANT_API_KEY`: API key for Qdrant (if authentication is required)
- `QDRANT_PORT`: Port for Qdrant (default: 6333)
- `QDRANT_COLLECTION_NAME`: Name of the Qdrant collection to query
- `DEBUG`: Enable debug mode (true/false)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `UVICORN_HOST`: Host for uvicorn server
- `UVICORN_PORT`: Port for uvicorn server

The API documentation is available at `/docs` when running the application.

## Testing

Run unit tests:
```bash
pytest tests/unit/ -v
```

Run integration tests:
```bash
pytest tests/integration/ -v
```

Run all tests:
```bash
pytest tests/ -v
```

## Architecture

The application follows a modular architecture:

- `src/agents/` - OpenAI agent implementations
- `src/api/` - FastAPI endpoints and routing
- `src/models/` - Pydantic data models
- `src/services/` - Business logic and external service integrations
- `src/config/` - Application configuration
- `tests/` - Unit, integration, and contract tests