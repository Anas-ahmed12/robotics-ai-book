from pydantic_settings import BaseSettings
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    # OpenRouter settings
    openrouter_api_key: str

    # Cohere settings for embeddings
    cohere_api_key: str

    # Qdrant settings
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: Optional[str] = None
    qdrant_collection_name: str = "robotics_kb"

    # Application settings
    debug: bool = False
    log_level: str = "INFO"
    uvicorn_host: str = "0.0.0.0"
    uvicorn_port: int = 8000

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra environment variables
    }


settings = Settings()