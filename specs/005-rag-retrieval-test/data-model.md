# Data Model: RAG Chatbot Integration – Retrieval Pipeline Testing

## Core Entities

### Query
- **query_text** (string): The input text to be converted to embeddings for similarity matching
- **query_vector** (list[float]): Numerical representation of the query text (embedding vector)
- **timestamp** (datetime): When the query was executed
- **execution_time_ms** (float): Time taken to execute the query in milliseconds

### RetrievedResult
- **content_id** (string): Unique identifier for the retrieved content
- **content_text** (string): Original text that matches the query based on vector similarity
- **relevance_score** (float): Cosine similarity score indicating how well the content matches the query intent (0.0-1.0)
- **content_domain** (string): Domain category of the retrieved content (e.g., "robotics", "AI", "programming")
- **vector_id** (string): ID of the vector in the Qdrant database

### TestResult
- **test_id** (string): Unique identifier for the test execution
- **query** (Query): The query object used in this test
- **results** (list[RetrievedResult]): List of retrieved results for the query
- **execution_time** (float): Total time taken for the query execution in seconds
- **relevant_results_count** (int): Number of results that exceed the relevance threshold
- **total_results_count** (int): Total number of results returned
- **relevance_percentage** (float): Percentage of relevant results (relevant_results_count / total_results_count * 100)
- **status** (string): "success", "no_results", or "error"
- **anomalies** (list[string]): List of any anomalies detected during the test

### TestExecution
- **execution_id** (string): Unique identifier for the test execution session
- **start_time** (datetime): When the test execution started
- **end_time** (datetime): When the test execution completed
- **queries_executed** (int): Number of queries executed in this session
- **queries_passed** (int): Number of queries that met success criteria
- **average_response_time** (float): Average response time across all queries
- **relevance_accuracy** (float): Overall percentage of relevant results across all queries
- **test_results** (list[TestResult]): List of individual test results
- **summary_report** (string): Markdown summary of the test execution

## Relationships
- A **TestExecution** contains multiple **TestResult** objects
- A **TestResult** contains one **Query** object and multiple **RetrievedResult** objects
- A **Query** may be associated with multiple **TestResult** objects across different test executions

## Validation Rules
- **Query**: query_text must not be empty, query_vector must have the same dimensions as stored embeddings
- **RetrievedResult**: relevance_score must be between 0.0 and 1.0, content_text must not be empty
- **TestResult**: relevance_percentage must be between 0.0 and 100.0, status must be one of the allowed values
- **TestExecution**: average_response_time must be positive, relevance_accuracy must be between 0.0 and 100.0

## State Transitions
- **TestResult**: pending → executing → completed (success/no_results/error)
- **TestExecution**: not_started → in_progress → completed → reported