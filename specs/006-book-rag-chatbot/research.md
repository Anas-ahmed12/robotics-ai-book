# Research: Integrated RAG Chatbot Frontend for Book

## Overview
This research document addresses the technical requirements for implementing a RAG chatbot frontend that integrates with the robotics-AI book, using OpenAI Agents/ChatKit SDK and connecting to existing backend endpoints.

## Decision: OpenAI Agents/ChatKit SDK Integration
**Rationale**: The feature specification requires using OpenAI Agents/ChatKit SDK for the frontend. This provides a pre-built, tested chat interface that handles common UX patterns and can be customized for our needs.

**Alternatives considered**:
- Building a custom chat interface from scratch: Would require more development time and introduce potential UX inconsistencies
- Using a different chat SDK: Would not meet the requirement of using OpenAI Agents/ChatKit SDK

## Decision: Text Selection Mechanism
**Rationale**: To allow users to select text from the book as context, we'll implement DOM text selection event handlers that capture the selected text and include it with the user's question when making API calls.

**Alternatives considered**:
- Highlight buttons on text: Would require modifying the book's content structure
- Copy-paste workflow: Would be less user-friendly and require additional steps

## Decision: Session Management Approach
**Rationale**: For maintaining conversation history and session state, we'll use browser sessionStorage to store the conversation history during the user's session. This provides persistence across page navigation within the book without requiring server-side storage.

**Alternatives considered**:
- localStorage: Would persist beyond the session, potentially causing confusion
- Server-side sessions: Would require additional backend development, which is outside scope
- URL parameters: Would clutter URLs and have length limitations

## Decision: API Communication Pattern
**Rationale**: Direct fetch API calls to the existing backend endpoint at /api/chat will be used. This maintains compatibility with the existing backend implementation from Spec-3 without requiring changes.

**Alternatives considered**:
- WebSocket connections: Would require backend changes that are outside scope
- GraphQL: Would require backend changes that are outside scope
- Custom protocol: Would add unnecessary complexity

## Decision: Styling and Theming
**Rationale**: CSS-based styling with a blue and white color scheme will be used to maintain consistency with the book's design requirements from the constitution. CSS variables will be used for easy theme management.

**Alternatives considered**:
- CSS-in-JS: Would add unnecessary complexity for a simple component
- CSS frameworks like Bootstrap: Would conflict with existing book styling
- Inline styles: Would be difficult to maintain and inconsistent with requirements

## Decision: Text Selection Context Handling
**Rationale**: When users select text, we'll capture the selection using the browser's Selection API and include it as a context parameter in the API request to the backend. This allows the RAG system to consider the selected text when generating responses.

**Technical Implementation**:
- Use `window.getSelection()` to capture user text selections
- Add event listeners to detect text selection on book content
- Format selected text appropriately before sending to backend