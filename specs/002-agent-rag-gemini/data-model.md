# Data Model: Agent-Based RAG Chatbot with Google Gemini

## Entity: Query
**Description:** User input text that needs to be processed by the agent

**Fields:**
- `id` (str): Unique identifier for the query
- `content` (str): The actual query text from the user
- `timestamp` (datetime): When the query was submitted
- `session_id` (str): Reference to the agent session
- `user_id` (str, optional): Identifier for the user making the query

**Validation Rules:**
- `content` must be between 1 and 10000 characters
- `content` must not be empty or whitespace only
- `session_id` must be a valid UUID format
- `timestamp` must be in ISO 8601 format

**State Transitions:**
- `pending` → `processing` → `completed` | `failed`

## Entity: AgentResponse
**Description:** System output containing agent-generated responses based on retrieved content

**Fields:**
- `id` (str): Unique identifier for the response
- `content` (str): The agent-generated response text
- `query_id` (str): Reference to the original query
- `timestamp` (datetime): When the response was generated
- `session_id` (str): Reference to the agent session
- `retrieved_context` (list[dict]): List of context chunks used in generating the response
- `tool_calls` (list[dict]): List of tools called during response generation
- `status` (str): Status of the response generation ('success', 'partial', 'failed')

**Validation Rules:**
- `content` must be between 1 and 50000 characters
- `query_id` must reference an existing query
- `retrieved_context` items must have 'content', 'source', and 'similarity_score' fields
- `status` must be one of the allowed values

## Entity: RetrievalResult
**Description:** Content retrieved from Qdrant database by the retrieval tool

**Fields:**
- `id` (str): Unique identifier for the retrieval result
- `content` (str): The retrieved text content
- `source` (str): Source document or reference
- `similarity_score` (float): Similarity score from vector search (0.0 to 1.0)
- `metadata` (dict): Additional metadata from Qdrant
- `query_embedding` (list[float]): The embedding used for the search
- `retrieved_at` (datetime): When the retrieval was performed

**Validation Rules:**
- `similarity_score` must be between 0.0 and 1.0
- `content` must not be empty
- `query_embedding` must be a valid vector (list of floats)
- `metadata` must not exceed 10KB in size

## Entity: AgentSession
**Description:** Context that maintains state for agent reasoning and tool invocation

**Fields:**
- `id` (str): Unique identifier for the session
- `created_at` (datetime): When the session was created
- `updated_at` (datetime): When the session was last updated
- `user_id` (str, optional): Identifier for the user associated with the session
- `conversation_history` (list[dict]): List of query-response pairs in the session
- `current_state` (dict): Current state of the agent's reasoning process
- `timeout_config` (dict): Timeout settings for the session

**Validation Rules:**
- `id` must be a valid UUID format
- `conversation_history` items must have 'query' and 'response' fields
- `timeout_config` must have 'max_execution_time' and 'tool_call_timeout' fields
- Session must be updated within the timeout period to remain active

## Entity: ToolInvocation
**Description:** Record of tools called by the agent during query processing

**Fields:**
- `id` (str): Unique identifier for the tool invocation
- `tool_name` (str): Name of the tool that was invoked
- `parameters` (dict): Parameters passed to the tool
- `result` (dict): Result returned by the tool
- `timestamp` (datetime): When the tool was invoked
- `query_id` (str): Reference to the query that triggered the tool call
- `status` (str): Status of the tool call ('success', 'failed', 'timeout')
- `execution_duration` (float): Time taken to execute the tool call in seconds

**Validation Rules:**
- `tool_name` must be a valid registered tool name
- `parameters` and `result` must be valid JSON objects
- `status` must be one of the allowed values
- `execution_duration` must be non-negative

## Relationships

### Query → AgentResponse
- One-to-many: One query can have multiple responses (in case of retries or follow-ups)
- Foreign Key: `query_id` in AgentResponse references `id` in Query

### Query → AgentSession
- Many-to-one: Many queries can belong to one session
- Foreign Key: `session_id` in Query references `id` in AgentSession

### AgentResponse → RetrievalResult
- Many-to-many: One response can use multiple retrieval results
- Junction: AgentResponse contains `retrieved_context` array with RetrievalResult references

### AgentSession → ToolInvocation
- One-to-many: One session can have multiple tool invocations
- Foreign Key: `query_id` in ToolInvocation links to Query which belongs to AgentSession

### Query → ToolInvocation
- One-to-many: One query can trigger multiple tool invocations
- Foreign Key: `query_id` in ToolInvocation references `id` in Query