from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Source(BaseModel):
    """
    Reference to knowledge base content used in response generation
    """
    id: str
    content: str
    similarity_score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any]


class ChatRequest(BaseModel):
    """
    Request model for chat endpoint
    """
    query: str = Field(min_length=1, max_length=10000)
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)


class ChatResponse(BaseModel):
    """
    Response model for chat endpoint
    """
    response: str = Field(min_length=1)
    sources: List[Source]
    query_id: str
    response_id: str
    confidence_score: float = Field(ge=0.0, le=1.0)


class ErrorResponse(BaseModel):
    """
    Error response model
    """
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """
    Response model for health check endpoint
    """
    status: str
    timestamp: datetime
    services: Dict[str, Dict[str, Any]]
    version: str