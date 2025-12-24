# Quickstart Guide: RAG Retrieval Pipeline Testing

## Prerequisites

- Python 3.11 or higher
- Access to Qdrant vector database (with existing embeddings from Spec-1)
- Same embedding model used in Spec-1 for generating query vectors
- Appropriate authentication credentials for Qdrant database

## Setup

1. **Install dependencies**:
   ```bash
   pip install qdrant-client numpy pandas pytest python-dotenv
   ```

2. **Configure environment**:
   Create a `.env` file with the following variables:
   ```env
   QDRANT_HOST=your-qdrant-host
   QDRANT_PORT=6333
   QDRANT_API_KEY=your-api-key-if-required
   EMBEDDING_MODEL_NAME=text-embedding-ada-002  # or equivalent model from Spec-1
   OPENAI_API_KEY=your-openai-api-key  # if using OpenAI embeddings
   COLLECTION_NAME=your-collection-name  # from Spec-1
   ```

3. **Verify Qdrant connection**:
   ```bash
   python -c "from rag_tester.qdrant_connector import QdrantConnector; conn = QdrantConnector(); print('Connection successful' if conn.test_connection() else 'Connection failed')"
   ```

## Running Tests

1. **Execute basic retrieval test**:
   ```bash
   python -m rag_tester.main --test-query "What is ROS2?"
   ```

2. **Run comprehensive test suite**:
   ```bash
   python -m rag_tester.main --run-tests
   ```

3. **Run specific test queries**:
   ```bash
   python -m rag_tester.main --queries-file test_queries.txt
   ```

## Sample Test Queries

Create a `test_queries.txt` file with sample queries like:
```
What is a robot operating system?
Explain reinforcement learning in robotics
How does computer vision work in autonomous robots?
What are the key features of ROS2?
Describe path planning algorithms
```

## Output Format

Test results will be saved in `test_results/` directory:
- `test_report_YYYYMMDD_HHMMSS.md`: Comprehensive test report in Markdown
- `detailed_results_YYYYMMDD_HHMMSS.json`: Detailed results in JSON format
- `anomalies_YYYYMMDD_HHMMSS.txt`: List of any anomalies detected

## Validation Criteria

The testing tool will validate:
- At least 80% of retrieved content is relevant to the query
- Response time is under 2 seconds on average
- Proper handling of edge cases (no results, multiple domains)
- Correct relevance scoring (using 0.7 threshold)

## Troubleshooting

- **Connection errors**: Verify QDRANT_HOST and credentials in `.env`
- **No results**: Check if the collection name is correct and contains embeddings
- **Low relevance**: Verify the same embedding model is used as in Spec-1