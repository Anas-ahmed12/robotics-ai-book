import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Configuration class for Qdrant connection and embeddings."""

    # Qdrant Configuration
    QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
    QDRANT_PORT = int(os.getenv('QDRANT_PORT', 6333))
    QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
    COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'default_collection')

    # Embedding Model Configuration
    EMBEDDING_MODEL_NAME = os.getenv('EMBEDDING_MODEL_NAME', 'text-embedding-ada-002')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

    # Performance Configuration
    DEFAULT_LIMIT = 5
    RELEVANCE_THRESHOLD = 0.7
    MAX_QUERY_LENGTH = 500

    @classmethod
    def validate_config(cls):
        """Validate that required configuration values are present."""
        errors = []

        if not cls.QDRANT_HOST:
            errors.append("QDRANT_HOST is required")

        if not cls.COLLECTION_NAME:
            errors.append("COLLECTION_NAME is required")

        if not cls.EMBEDDING_MODEL_NAME:
            errors.append("EMBEDDING_MODEL_NAME is required")

        return errors