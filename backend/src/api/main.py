from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.settings import settings
import structlog
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()
# Configure logging first
from src.services.logging_service import configure_logging
configure_logging()

logger = structlog.get_logger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Knowledge Base Chatbot API",
    description="""
    API for interacting with the knowledge base chatbot using RAG (Retrieval-Augmented Generation).

    This API allows users to query a knowledge base and receive intelligent responses generated using OpenAI
    and relevant content retrieved from a Qdrant vector database.
    """,
    version="1.0.0",
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    # Performance optimizations
    timeout=60  # 60 second timeout for requests
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add GZip compression middleware for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware to allow requests from Docusaurus frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware for request handling
@app.middleware("http")
async def add_process_time_header(request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include API routes
from src.api.chat_endpoints import router as chat_router
from src.api.health_endpoints import router as health_router

app.include_router(chat_router, prefix="/api/v1", tags=["chat"])
app.include_router(health_router, prefix="/api/v1", tags=["health"])

# logger.info("FastAPI app initialized", debug=settings.debug, log_level=settings.log_level)  # Comment out to avoid asyncio issues during import

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api.main:app",
        host=settings.uvicorn_host,
        port=settings.uvicorn_port,
        reload=settings.debug
    )