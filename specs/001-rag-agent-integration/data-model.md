# Data Model: Knowledge Base Chatbot Integration

## Overview
This document defines the data models for the knowledge base chatbot integration system based on the feature specification.

## Core Entities

### 1. Query
**Description**: User input text that needs to be processed and matched against knowledge base content
**Fields**:
- `id` (str): Unique identifier for the query
- `content` (str): The actual query text from the user
- `timestamp` (datetime): When the query was received
- `user_id` (str, optional): Identifier for the user making the query
- `session_id` (str, optional): Session identifier for conversation context
- `metadata` (dict, optional): Additional query metadata

**Validation Rules**:
- Content must not be empty
- Content length should be between 1 and 10000 characters
- Timestamp must be in ISO 8601 format

### 2. Response
**Description**: System output containing relevant information retrieved from the knowledge base
**Fields**:
- `id` (str): Unique identifier for the response
- `query_id` (str): Reference to the original query
- `content` (str): The response text to the user
- `sources` (list[Source]): List of sources used to generate the response
- `confidence_score` (float): Confidence score for the response (0.0 to 1.0)
- `timestamp` (datetime): When the response was generated
- `metadata` (dict, optional): Additional response metadata

**Validation Rules**:
- Content must not be empty
- Confidence score must be between 0.0 and 1.0
- Sources must be valid Source objects

### 3. Source
**Description**: Reference to knowledge base content used in response generation
**Fields**:
- `id` (str): Unique identifier for the source
- `content` (str): The actual content from the knowledge base
- `similarity_score` (float): Similarity score to the original query (0.0 to 1.0)
- `metadata` (dict): Additional metadata about the source (e.g., document type, author, date)

**Validation Rules**:
- Content must not be empty
- Similarity score must be between 0.0 and 1.0

### 4. Knowledge Entry
**Description**: Content stored in the knowledge base for retrieval and matching
**Fields**:
- `id` (str): Unique identifier for the knowledge entry
- `content` (str): The actual knowledge content
- `embedding` (list[float]): Vector representation of the content
- `metadata` (dict): Metadata about the knowledge entry
- `created_at` (datetime): When the entry was created
- `updated_at` (datetime): When the entry was last updated

**Validation Rules**:
- Content must not be empty
- Embedding must have the correct dimensionality for the vector database
- Metadata must be a valid dictionary

### 5. Conversation
**Description**: Session context that maintains state between multiple related queries
**Fields**:
- `id` (str): Unique identifier for the conversation
- `user_id` (str, optional): Identifier for the user
- `session_id` (str): Session identifier
- `created_at` (datetime): When the conversation started
- `updated_at` (datetime): When the conversation was last updated
- `messages` (list[Message]): List of messages in the conversation
- `metadata` (dict, optional): Additional conversation metadata

**Validation Rules**:
- Session ID must be unique
- Messages must be valid Message objects

### 6. Message
**Description**: Individual message within a conversation
**Fields**:
- `id` (str): Unique identifier for the message
- `conversation_id` (str): Reference to the parent conversation
- `role` (str): Role of the message sender ('user' or 'assistant')
- `content` (str): The message content
- `timestamp` (datetime): When the message was created
- `metadata` (dict, optional): Additional message metadata

**Validation Rules**:
- Role must be either 'user' or 'assistant'
- Content must not be empty

## API Request/Response Models

### Chat Request
**Description**: Request model for chat endpoint
**Fields**:
- `query` (str): The user query text
- `session_id` (str, optional): Session identifier for conversation context
- `user_id` (str, optional): User identifier
- `temperature` (float, optional): Temperature parameter for response generation (0.0 to 1.0)

**Validation Rules**:
- Query must not be empty
- Temperature must be between 0.0 and 1.0 if provided

### Chat Response
**Description**: Response model for chat endpoint
**Fields**:
- `response` (str): The chatbot response
- `sources` (list[Source]): List of sources used to generate the response
- `query_id` (str): ID of the original query
- `response_id` (str): ID of the generated response
- `confidence_score` (float): Confidence score for the response

**Validation Rules**:
- Response must not be empty
- Confidence score must be between 0.0 and 1.0

### Health Check Response
**Description**: Response model for health check endpoint
**Fields**:
- `status` (str): Overall system status ('healthy', 'degraded', 'unhealthy')
- `timestamp` (datetime): When the health check was performed
- `services` (dict): Status of individual services
- `version` (str): Application version

**Validation Rules**:
- Status must be one of the allowed values
- Services must be a valid dictionary of service statuses

## Relationships

1. **Query → Response**: One-to-one relationship (each query generates one response)
2. **Response → Source**: One-to-many relationship (each response can have multiple sources)
3. **Conversation → Message**: One-to-many relationship (each conversation contains multiple messages)
4. **Message → Query/Response**: Each message represents either a user query or system response

## State Transitions

### Query States
- `pending`: Query received, waiting for processing
- `processing`: Query being processed by the system
- `completed`: Query processed successfully
- `failed`: Query processing failed

### Response States
- `generating`: Response being generated
- `completed`: Response generated successfully
- `error`: Error occurred during response generation