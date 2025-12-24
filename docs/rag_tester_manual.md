# RAG Retrieval Pipeline Testing Tool Manual

## Overview

The RAG Retrieval Pipeline Testing Tool is designed to validate the retrieval pipeline functionality of the RAG system. It connects to the Qdrant vector database, executes sample test queries, validates the relevance and accuracy of returned content, logs results and any anomalies, and produces comprehensive documentation of the testing process and findings.

## Features

- Execute single test queries against the Qdrant database
- Run comprehensive test suites with multiple queries
- Validate retrieval accuracy with configurable thresholds
- Generate detailed test reports in Markdown format
- Log anomalies and performance metrics
- Support for content domain grouping

## Installation

1. Ensure Python 3.11+ is installed
2. Install dependencies from requirements.txt:
   ```bash
   pip install -r backend/rag_tester/requirements.txt
   ```

## Configuration

Create a `.env` file in the `backend/rag_tester/` directory with the following variables:

```env
QDRANT_HOST=your-qdrant-host
QDRANT_PORT=6333
QDRANT_API_KEY=your-api-key-if-required
EMBEDDING_MODEL_NAME=text-embedding-ada-002  # or equivalent model from Spec-1
OPENAI_API_KEY=your-openai-api-key  # if using OpenAI embeddings
COLLECTION_NAME=your-collection-name  # from Spec-1
```

## Usage

### Command Line Interface

The tool provides several command-line options:

#### Single Query Test
```bash
python -m backend.rag_tester --test-query "What is ROS2?"
```

#### Comprehensive Test Suite
```bash
python -m backend.rag_tester --run-tests
```

#### Custom Queries from File
```bash
python -m backend.rag_tester --queries-file test_queries.txt
```

#### Custom Parameters
```bash
python -m backend.rag_tester --test-query "Explain reinforcement learning" --limit 10 --threshold 0.6
```

### Parameters

- `--test-query`: Execute a single test query
- `--run-tests`: Run comprehensive test suite with default queries
- `--queries-file`: Path to a file containing test queries (one per line)
- `--limit`: Number of results to return per query (default: 5)
- `--threshold`: Relevance threshold for considering results relevant (default: 0.7)

## Output Files

The tool generates the following output files in the `test_results/` directory:

- `test_report_YYYYMMDD_HHMMSS.md`: Comprehensive test report in Markdown format
- `detailed_results_YYYYMMDD_HHMMSS.json`: Detailed results in JSON format
- `anomalies_YYYYMMDD_HHMMSS.txt`: List of any anomalies detected

## Validation Criteria

The testing tool validates:

- At least 80% of retrieved content is relevant to the query
- Response time is under 2 seconds on average
- Proper handling of edge cases (no results, multiple domains)
- Correct relevance scoring (using 0.7 threshold by default)

## Architecture

### Core Components

1. **QdrantConnector**: Handles connection and queries to the Qdrant vector database
2. **EmbeddingService**: Generates embeddings using the same model as Spec-1
3. **TestRunner**: Executes test queries and manages the testing workflow
4. **ResultsLogger**: Generates reports and logs test results
5. **RetrievalValidator**: Validates accuracy and relevance of results

### Data Models

- **Query**: Represents a search request with text and vector
- **RetrievedResult**: Contains the retrieved content with relevance scores
- **TestResult**: Results for a single test query execution
- **TestExecution**: A complete test execution session with multiple queries

## Troubleshooting

- **Connection errors**: Verify QDRANT_HOST and credentials in `.env`
- **No results**: Check if the collection name is correct and contains embeddings
- **Low relevance**: Verify the same embedding model is used as in Spec-1
- **Performance issues**: Ensure the Qdrant database has appropriate indexing

## Performance Targets

- Average response time: &lt;2 seconds
- Availability: 95% during testing period
- Relevance accuracy: At least 80% of results should be relevant

## API Contract

The tool follows the API contract defined in `specs/005-rag-retrieval-test/contracts/test-api.yaml` for consistency with the overall system architecture.