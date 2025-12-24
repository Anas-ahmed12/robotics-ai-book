from fastapi import APIRouter, HTTPException, Request
import structlog
from typing import Dict, Any
from src.models.query_models import ChatRequest, ChatResponse, ErrorResponse
from src.agents.openrouter_agent import robotics_ai_book_assistant
from src.config.settings import settings
from src.services.logging_service import add_request_context
import uuid
import time
import asyncio


router = APIRouter()
logger = structlog.get_logger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest) -> ChatResponse:
    """
    Process a user query and return a response with relevant sources using OpenRouter agent-based RAG
    """
    request_id = str(uuid.uuid4())
    add_request_context(request_id=request_id, query=chat_request.query[:50] + "..." if len(chat_request.query) > 50 else chat_request.query)

    logger.info("Chat endpoint called", request_id=request_id)

    try:
        # Additional validation beyond Pydantic model validation
        if not chat_request.query or chat_request.query.isspace():
            logger.warning("Empty query received", request_id=request_id)
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        if len(chat_request.query) > 10000:
            logger.warning("Query too long", request_id=request_id, query_length=len(chat_request.query))
            raise HTTPException(status_code=400, detail="Query too long, maximum 10000 characters allowed")

        # Check for potentially problematic content
        if any(keyword in chat_request.query.lower() for keyword in ["<script", "javascript:", "eval("]):
            logger.warning("Potentially unsafe query content detected", request_id=request_id)
            raise HTTPException(
                status_code=400,
                detail="Query contains potentially unsafe content."
            )

        # Process the query with the Robotics AI Book Assistant
        result = robotics_ai_book_assistant.process_query(
            query=chat_request.query,
            session_id=chat_request.session_id
        )

        # Map agent response to API response (maintaining existing API contract)
        response = ChatResponse(
            response=result["response"],
            sources=result["sources"],
            query_id=result["query_id"],
            response_id=str(uuid.uuid4()),  # Generate a response_id as expected by the model
            confidence_score=result["confidence_score"]
        )

        logger.info("Chat query processed successfully", request_id=request_id, query_id=result["query_id"])
        return response

    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error("Chat endpoint failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/chat/health")
async def chat_health() -> Dict[str, Any]:
    """
    Health check for the chat endpoint
    """
    request_id = str(uuid.uuid4())
    add_request_context(request_id=request_id)

    logger.info("Chat health endpoint called", request_id=request_id)

    try:
        # Use the Robotics AI Book Assistant's health check
        health_info = robotics_ai_book_assistant.health_check()
        logger.info("Chat health check completed", request_id=request_id, status=health_info["status"])
        return health_info
    except Exception as e:
        logger.error("Chat health check failed", request_id=request_id, error=str(e))
        raise HTTPException(
            status_code=503,
            detail=f"Service unavailable: {str(e)}"
        )