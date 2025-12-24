from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Query(BaseModel):
    """
    User input text that needs to be processed and matched against knowledge base content
    """
    id: str
    content: str = Field(min_length=1, max_length=10000)
    timestamp: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Response(BaseModel):
    """
    System output containing relevant information retrieved from the knowledge base
    """
    id: str
    query_id: str
    content: str = Field(min_length=1)
    sources: List['Source']
    confidence_score: float = Field(ge=0.0, le=1.0)
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class KnowledgeEntry(BaseModel):
    """
    Content stored in the knowledge base for retrieval and matching
    """
    id: str
    content: str = Field(min_length=1)
    embedding: List[float]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class Conversation(BaseModel):
    """
    Session context that maintains state between multiple related queries
    """
    id: str
    user_id: Optional[str] = None
    session_id: str
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None


class Message(BaseModel):
    """
    Individual message within a conversation
    """
    id: str
    conversation_id: str
    role: str = Field(pattern=r'^(user|assistant)$')
    content: str = Field(min_length=1)
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class QueryState(BaseModel):
    """
    State of a query during processing
    """
    id: str
    state: str = Field(pattern=r'^(pending|processing|completed|failed)$')
    timestamp: datetime


class ResponseState(BaseModel):
    """
    State of a response during generation
    """
    id: str
    state: str = Field(pattern=r'^(generating|completed|error)$')
    timestamp: datetime