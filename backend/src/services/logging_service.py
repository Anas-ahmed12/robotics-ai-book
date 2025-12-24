import structlog
import logging
from typing import Dict, Any, Optional
from contextvars import ContextVar
from src.config.settings import settings
import uuid


# Context variable to store request ID for correlation
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


def configure_logging():
    """
    Configure structlog with appropriate processors and output
    """
    # Configure standard library logging first
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.stdlib.AsyncBoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """
    Get a configured logger instance
    """
    return structlog.get_logger(name)


def set_request_id(request_id: str):
    """
    Set the request ID in the context for correlation
    """
    request_id_var.set(request_id)


def get_request_id() -> Optional[str]:
    """
    Get the current request ID from context
    """
    return request_id_var.get()


def add_request_context(**kwargs):
    """
    Add request context to the logger
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def add_correlation_id(correlation_id: str = None):
    """
    Add a correlation ID to the current context for request tracing
    """
    if correlation_id is None:
        correlation_id = str(uuid.uuid4())

    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    set_request_id(correlation_id)
    return correlation_id


# Initialize logging configuration
configure_logging()

# Create a module-level logger
logger = get_logger(__name__)
# logger.info("Logging service configured", log_level=settings.log_level)  # Comment out to avoid asyncio issues during import