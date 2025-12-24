import time
from datetime import datetime
from typing import List, Optional, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue
from .config import Config


class QdrantConnector:
    """Module for connecting to Qdrant database and performing vector search operations."""

    def __init__(self):
        """Initialize the Qdrant connector with configuration from environment."""
        self.config = Config()

        # Initialize Qdrant client
        if self.config.QDRANT_API_KEY:
            self.client = QdrantClient(
                host=self.config.QDRANT_HOST,
                port=self.config.QDRANT_PORT,
                api_key=self.config.QDRANT_API_KEY
            )
        else:
            self.client = QdrantClient(
                host=self.config.QDRANT_HOST,
                port=self.config.QDRANT_PORT
            )

    def test_connection(self) -> bool:
        """Test connection to Qdrant database."""
        try:
            # Try to list collections to verify connection
            collections = self.client.get_collections()
            return True
        except Exception as e:
            print(f"Connection test failed: {str(e)}")
            return False

    def search_vectors(
        self,
        query_vector: List[float],
        limit: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar vectors in the Qdrant collection.

        Args:
            query_vector: The embedding vector to search for
            limit: Maximum number of results to return
            filters: Optional filters to apply to the search

        Returns:
            List of matching vectors with their metadata
        """
        try:
            # Prepare filters if provided
            qdrant_filters = None
            if filters:
                qdrant_filters = self._convert_filters(filters)

            # Perform the search
            search_results = self.client.search(
                collection_name=self.config.COLLECTION_NAME,
                query_vector=query_vector,
                limit=limit,
                query_filter=qdrant_filters,
                with_payload=True,
                with_vectors=False
            )

            # Format results
            formatted_results = []
            for result in search_results:
                formatted_result = {
                    'content_id': result.id,
                    'content_text': result.payload.get('content', ''),
                    'relevance_score': result.score,
                    'content_domain': result.payload.get('domain', ''),
                    'vector_id': result.id,
                    'payload': result.payload
                }
                formatted_results.append(formatted_result)

            return formatted_results

        except Exception as e:
            # Handle Qdrant database unavailability
            error_msg = f"Qdrant search failed: {str(e)}"
            print(error_msg)
            # Re-raise the exception so calling code can handle it appropriately
            raise ConnectionError(error_msg) from e

    def _convert_filters(self, filters: Dict) -> models.Filter:
        """Convert dictionary filters to Qdrant Filter model."""
        conditions = []
        for key, value in filters.items():
            conditions.append(
                models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                )
            )

        return models.Filter(
            must=conditions
        )

    def get_vector_count(self) -> int:
        """Get the total number of vectors in the collection."""
        try:
            collection_info = self.client.get_collection(self.config.COLLECTION_NAME)
            return collection_info.points_count
        except Exception as e:
            print(f"Failed to get vector count: {str(e)}")
            return 0

    def health_check(self) -> Dict[str, Any]:
        """Perform a health check on the Qdrant connection."""
        start_time = time.time()
        is_healthy = self.test_connection()
        response_time = time.time() - start_time

        return {
            'is_healthy': is_healthy,
            'response_time': response_time,
            'collection_name': self.config.COLLECTION_NAME,
            'vector_count': self.get_vector_count(),
            'timestamp': datetime.now().isoformat()
        }

    def availability_monitor(self, check_interval: int = 300) -> Dict[str, Any]:  # 300 seconds = 5 minutes
        """
        Monitor availability to maintain 95% uptime.

        Args:
            check_interval: Time in seconds between health checks (default 5 minutes)

        Returns:
            Dictionary with availability metrics
        """
        # For this implementation, we'll return availability statistics
        # In a real implementation, this would run continuously and track uptime
        current_status = self.health_check()

        # Calculate availability percentage (this would normally be tracked over time)
        # For now, return the current status as part of availability tracking
        availability_stats = {
            'current_status': current_status,
            'check_interval_seconds': check_interval,
            'target_availability': 95.0,  # 95% availability target (SC-007)
            'monitoring_since': datetime.now().isoformat(),
            'last_check': current_status['timestamp']
        }

        return availability_stats