import structlog
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from src.config.settings import settings


logger = structlog.get_logger(__name__)


class QdrantService:
    """
    Service class to handle Qdrant vector database operations
    """

    def __init__(self):
        # Initialize logger
        self.logger = logger

        # Check if QDRANT_HOST is a URL (for Qdrant Cloud) or just a host
        if settings.qdrant_host.startswith(('http://', 'https://')):
            # Use URL-based connection for Qdrant Cloud
            self.client = QdrantClient(
                url=settings.qdrant_host,
                api_key=settings.qdrant_api_key,
                prefer_grpc=False
            )
            self.logger.info("QdrantService initialized with URL", url=settings.qdrant_host)
        else:
            # Use host/port connection for local Qdrant
            self.client = QdrantClient(
                host=settings.qdrant_host,
                port=settings.qdrant_port,
                api_key=settings.qdrant_api_key,
                prefer_grpc=False  # Using REST API instead of gRPC for simplicity
            )
            self.logger.info("QdrantService initialized", host=settings.qdrant_host, port=settings.qdrant_port)

        self.collection_name = settings.qdrant_collection_name

    def health_check(self) -> bool:
        """
        Check if Qdrant service is accessible
        """
        try:
            # Try to get collection info to verify connectivity
            self.client.get_collection(self.collection_name)
            self.logger.info("Qdrant health check successful")
            return True
        except Exception as e:
            self.logger.error("Qdrant health check failed", error=str(e))
            return False

    def is_available(self) -> bool:
        """
        Check if Qdrant service is available without raising exceptions
        """
        try:
            # Simple connectivity check
            self.client.get_collection(self.collection_name)
            return True
        except Exception as e:
            self.logger.warning("Qdrant service not available", error=str(e))
            return False

    def search(self, query_vector: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in the collection
        """
        try:
            self.logger.info("Starting Qdrant search", limit=limit, vector_length=len(query_vector))

            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                with_payload=True,
                with_vectors=False
            )

            # Format results to match our source model
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "id": str(result.id),
                    "content": result.payload.get("content", ""),
                    "similarity_score": float(result.score),
                    "metadata": result.payload.get("metadata", {})
                })

            self.logger.info("Qdrant search completed", count=len(formatted_results), collection=self.collection_name)
            return formatted_results

        except Exception as e:
            self.logger.error("Qdrant search failed", error=str(e), limit=limit)
            raise e

    def get_vector_size(self) -> Optional[int]:
        """
        Get the size of vectors in the collection
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)
            # Get the first vector's size from the collection
            # This assumes all vectors in the collection have the same size
            return collection_info.config.params.vectors.size
        except Exception as e:
            self.logger.error("Failed to get vector size", error=str(e))
            return None


# Global instance
qdrant_service = QdrantService()