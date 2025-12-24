from fastapi import APIRouter
import structlog
from typing import Dict, Any
from src.models.query_models import HealthResponse
from src.agents.openrouter_agent import robotics_ai_book_assistant
from src.config.settings import settings
from src.services.logging_service import add_request_context
from datetime import datetime
import uuid
import time


router = APIRouter()
logger = structlog.get_logger(__name__)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint that verifies Qdrant and OpenRouter connectivity for Robotics AI Book
    """
    request_id = str(uuid.uuid4())
    add_request_context(request_id=request_id)

    logger.info("Health check endpoint called", request_id=request_id)

    try:
        # Use the Robotics AI Book Assistant's health check
        health_info = robotics_ai_book_assistant.health_check()

        # Create and return the health response
        response = HealthResponse(
            status=health_info["status"],
            timestamp=datetime.fromisoformat(health_info["timestamp"]),
            services=health_info["services"],
            version=health_info["version"]
        )

        logger.info("Health check completed", request_id=request_id, status=health_info["status"])
        return response

    except Exception as e:
        logger.error("Health check failed", request_id=request_id, error=str(e))
        # Return an unhealthy status if there's an error
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            services={
                "qdrant": {"status": "down", "response_time": None},
                "openrouter": {"status": "down", "response_time": None}
            },
            version="1.0.0"
        )


@router.get("/ready")
async def readiness_check() -> Dict[str, str]:
    """
    Readiness check endpoint
    """
    request_id = str(uuid.uuid4())
    add_request_context(request_id=request_id)

    logger.info("Readiness check endpoint called", request_id=request_id)

    try:
        # Use the Robotics AI Book Assistant's health check
        health_info = robotics_ai_book_assistant.health_check()

        if health_info["status"] in ["healthy", "degraded"]:
            logger.info("Readiness check passed", request_id=request_id)
            return {"status": "ready"}
        else:
            logger.warning("Readiness check failed", request_id=request_id, status=health_info["status"])
            return {"status": "not_ready"}
    except Exception as e:
        logger.error("Readiness check failed", request_id=request_id, error=str(e))
        return {"status": "not_ready"}