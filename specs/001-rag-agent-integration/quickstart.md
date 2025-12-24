# Quickstart Guide: Knowledge Base Chatbot Integration

This quickstart belongs to an **older OpenAI-based implementation** and is no longer active.

### Updated Implementation
Please use the latest specification and implementation under:

**specs/002-agent-rag-gemini/**

### Notes
- This document is kept **only for historical reference**
- ❌ Do NOT follow these steps for setup or execution
- ✅ Refer to the new spec for the correct agent + Gemini workflow

---
## Overview
This guide provides instructions for setting up and running the knowledge base chatbot integration service locally.

## Prerequisites
- Python 3.11 or higher
- pip package manager
- Access to OpenAI API key
- Access to Qdrant vector database (local or remote)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd robotics-ai-book
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development/testing
```

### 4. Configure Environment Variables
Create a `.env` file in the backend directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_HOST=your_qdrant_host
QDRANT_PORT=6333
QDRANT_API_KEY=your_qdrant_api_key  # if required
QDRANT_COLLECTION_NAME=robotics_kb
DEBUG=true
LOG_LEVEL=INFO
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
```

### 5. Run the Application
```bash
# Using uvicorn directly
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Or using the run script if available
python -m src.api.main
```

### 6. Alternative: Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## API Usage Examples

### Chat Endpoint
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the fundamental principles of robotics?",
    "session_id": "sess_123456789",
    "temperature": 0.7
  }'
```

### Health Check
```bash
curl -X GET http://localhost:8000/health
```

## Testing

### Run Unit Tests
```bash
pytest tests/unit/ -v
```

### Run Integration Tests
```bash
pytest tests/integration/ -v
```

### Run All Tests
```bash
pytest tests/ -v
```

## Configuration Options

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key for agent functionality
- `QDRANT_HOST`: Host address for Qdrant database
- `QDRANT_PORT`: Port for Qdrant database (default: 6333)
- `QDRANT_API_KEY`: API key for Qdrant (if authentication required)
- `QDRANT_COLLECTION_NAME`: Name of the collection to query
- `DEBUG`: Enable debug mode (true/false)
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `UVICORN_HOST`: Host for uvicorn server
- `UVICORN_PORT`: Port for uvicorn server

### Default Values
If environment variables are not set, the application will use these defaults:
- QDRANT_HOST: localhost
- QDRANT_PORT: 6333
- LOG_LEVEL: INFO
- UVICORN_HOST: 0.0.0.0
- UVICORN_PORT: 8000

## Development Workflow

1. **Start Development Server**:
   ```bash
   uvicorn src.api.main:app --reload
   ```

2. **Access API Documentation**:
   - OpenAPI: http://localhost:8000/docs
   - Redoc: http://localhost:8000/redoc

3. **Run Linting**:
   ```bash
   flake8 src/
   black --check src/
   ```

4. **Run Type Checks**:
   ```bash
   mypy src/
   ```

## Troubleshooting

### Common Issues
1. **OpenAI API Error**: Verify your API key is correct and has sufficient quota
2. **Qdrant Connection Error**: Check that Qdrant is running and accessible
3. **Port Already in Use**: Change UVICORN_PORT in environment variables

### Enable Debug Logging
Set `LOG_LEVEL=DEBUG` in your environment variables to get more detailed logs.

## Next Steps
1. Implement the core agent functionality in `src/agents/knowledge_agent.py`
2. Connect to your Qdrant instance with actual knowledge base data
3. Test with sample queries to validate the RAG pipeline
4. Deploy to your preferred hosting environment