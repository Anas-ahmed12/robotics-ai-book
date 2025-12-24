# Data Model: Integrated RAG Chatbot Frontend for Book

## Overview
This document defines the data structures and entities for the RAG chatbot frontend component.

## Key Entities

### User Session
**Description**: Represents a user's interaction state with the chatbot during their visit

**Fields**:
- `sessionId` (string): Unique identifier for the session
- `createdAt` (timestamp): When the session started
- `conversationHistory` (array): List of messages in the current conversation
- `isActive` (boolean): Whether the session is currently active

**Validation Rules**:
- `sessionId` must be a valid UUID format
- `createdAt` must be a valid ISO 8601 timestamp
- `conversationHistory` must not exceed 100 messages

### Chat Message
**Description**: A unit of communication between user and system

**Fields**:
- `id` (string): Unique identifier for the message
- `sender` (enum: 'user' | 'agent'): Who sent the message
- `content` (string): The message text content
- `timestamp` (timestamp): When the message was sent/received
- `context` (object, optional): Additional context like selected text
- `status` (enum: 'sent' | 'pending' | 'delivered' | 'error'): Message transmission status

**Validation Rules**:
- `id` must be unique within the conversation
- `sender` must be either 'user' or 'agent'
- `content` must be 1-2000 characters
- `timestamp` must be a valid ISO 8601 timestamp
- `status` must be one of the defined values

### Text Selection Context
**Description**: User-selected text from the book that provides additional context for the question

**Fields**:
- `selectedText` (string): The text that was selected by the user
- `sourceUrl` (string): The URL of the page where text was selected
- `selectionStartOffset` (number, optional): Character offset where selection started
- `selectionEndOffset` (number, optional): Character offset where selection ended
- `timestamp` (timestamp): When the text was selected

**Validation Rules**:
- `selectedText` must be 1-1000 characters
- `sourceUrl` must be a valid URL
- `selectionStartOffset` and `selectionEndOffset` must be non-negative if provided

### API Request Payload
**Description**: Structure of data sent to the backend API

**Fields**:
- `query` (string): The user's question
- `session_id` (string): The current session ID
- `context` (object, optional): Additional context including selected text
- `context.selected_text` (string, optional): Text selected by user from book

**Validation Rules**:
- `query` must be 1-2000 characters
- `session_id` must be a valid session identifier
- `context.selected_text` must be 1-1000 characters if provided

### API Response Payload
**Description**: Structure of data received from the backend API

**Fields**:
- `response` (string): The agent's response to the query
- `sources` (array): List of sources used to generate the response
- `query_id` (string): Unique identifier for the query
- `response_id` (string): Unique identifier for the response
- `confidence_score` (number): Confidence level of the response (0-1)

**Validation Rules**:
- `response` must be 1-10000 characters
- `query_id` and `response_id` must be valid identifiers
- `confidence_score` must be between 0 and 1

## State Transitions

### Message Status Transitions
1. `'sent'` → `'pending'`: When message is sent to backend
2. `'pending'` → `'delivered'`: When response is received successfully
3. `'pending'` → `'error'`: When there's an error processing the message
4. `'error'` → `'pending'`: When user retries a failed message

### Session State Transitions
1. `isActive: false` → `isActive: true`: When user starts interacting with chat
2. `isActive: true` → `isActive: false`: When session expires or user leaves