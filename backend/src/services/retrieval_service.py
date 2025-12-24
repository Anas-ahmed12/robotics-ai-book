import structlog
from typing import List, Dict, Any, Optional
from src.config.settings import settings
from src.services.qdrant_service import qdrant_service
import uuid
from datetime import datetime
import cohere


logger = structlog.get_logger(__name__)


class RetrievalService:
    """
    Service class to handle knowledge retrieval and response generation
    """

    def __init__(self):
        self.qdrant_service = qdrant_service
        # Initialize Cohere client for embeddings (1024-dimensional vectors)
        if settings.cohere_api_key:
            self.cohere_client = cohere.Client(api_key=settings.cohere_api_key)
        else:
            logger.warning("COHERE_API_KEY not found in settings. Using placeholder embedding function.")
            self.cohere_client = None
        logger.info("RetrievalService initialized")

    def retrieve_and_generate(self, query: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Main method to retrieve relevant content and generate response
        """
        query_id = str(uuid.uuid4())
        logger.info("Starting retrieval and generation", query_id=query_id, query_length=len(query), session_id=session_id)

        try:
            # Step 1: Generate embedding for the query
            logger.info("Generating embedding for query", query_id=query_id)
            query_embedding = self._get_embedding(query)

            # Step 2: Check if Qdrant is available before searching
            if not self.qdrant_service.is_available():
                logger.warning("Qdrant service not available, proceeding with general response", query_id=query_id)
                # Generate a response without specific knowledge base content
                response_content = self._generate_general_response(query)
                sources = []
            else:
                # Search for relevant content in Qdrant
                logger.info("Searching Qdrant for relevant content", query_id=query_id)
                sources = self.qdrant_service.search(query_embedding, limit=5)

                # Step 3: Generate response using OpenAI with retrieved context
                logger.info("Generating response with OpenAI", query_id=query_id, source_count=len(sources))
                response_content = self._generate_response_with_context(query, sources)

            # Step 4: Format and return the response
            result = {
                "response": response_content,
                "sources": sources,
                "query_id": query_id,
                "response_id": str(uuid.uuid4()),
                "confidence_score": self._calculate_confidence_score(sources) if sources else 0.0
            }

            logger.info("Retrieval and generation completed", query_id=query_id, response_length=len(response_content))
            return result

        except Exception as e:
            logger.error("Retrieval and generation failed", query_id=query_id, error=str(e), query=query[:50] + "..." if len(query) > 50 else query)
            raise e

    def _generate_general_response(self, query: str) -> str:
        """
        Generate a general response when Qdrant is unavailable
        """
        import time
        start_time = time.time()

        try:
            # For now, return a simple response since we don't have an LLM client
            response = f"I understand you're asking about: {query}. The knowledge base is currently unavailable, but I'll do my best to help with general information about robotics and AI."

            elapsed_time = time.time() - start_time
            logger.info("Generated general response due to Qdrant unavailability", elapsed_time=elapsed_time)
            return response
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error("Failed to generate general response", error=str(e), elapsed_time=elapsed_time)
            return "I'm sorry, but I'm currently unable to process your query. Please try again later."

    def _get_embedding(self, text: str) -> List[float]:
        """
        Get embedding for text using Cohere API (1024-dimensional vectors)
        Falls back to placeholder implementation if Cohere API key is not available
        """
        import time
        start_time = time.time()

        try:
            if self.cohere_client:
                # Use Cohere for embeddings (1024-dimensional vectors)
                response = self.cohere_client.embed(
                    texts=[text],
                    model='embed-english-v3.0',  # Standard model with 1024 dims
                    input_type='search_query'  # Required parameter for Cohere v3 models
                )
                embedding = response.embeddings[0]  # Get the first (and only) embedding
                logger.info("Cohere embedding generated successfully", elapsed_time=time.time()-start_time)
            else:
                # Fallback to placeholder implementation for development
                logger.warning("Using placeholder embedding due to missing Cohere API key", elapsed_time=time.time()-start_time)
                import hashlib
                import struct

                # Create a simple hash-based embedding (not a real embedding but for functionality)
                text_hash = hashlib.md5(text.encode()).hexdigest()
                embedding = []
                for i in range(0, len(text_hash), 2):
                    hex_pair = text_hash[i:i+2]
                    val = int(hex_pair, 16) / 255.0  # Normalize to 0-1 range
                    embedding.append(val)

                # Pad or truncate to the expected dimension (1024 to match Cohere)
                while len(embedding) < 1024:
                    embedding.append(0.0)
                embedding = embedding[:1024]

            elapsed_time = time.time() - start_time
            logger.info("Embedding retrieved successfully", vector_length=len(embedding), elapsed_time=elapsed_time)
            return embedding
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error("Failed to get embedding", error=str(e), elapsed_time=elapsed_time)
            raise e

    def _generate_response_with_context(self, query: str, sources: List[Dict[str, Any]]) -> str:
        """
        Generate response with retrieved context - placeholder implementation
        """
        import time
        start_time = time.time()

        try:
            # Format context from sources
            context = "\n\n".join([source["content"] for source in sources])

            # Create a simple response with the context
            response = f"Based on the following information: {context}\n\nAnswer to your question '{query}': This is a placeholder response. In a real implementation, this would be generated by an LLM with the provided context."

            elapsed_time = time.time() - start_time
            logger.info("Response generated with context", elapsed_time=elapsed_time)
            return response

        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error("Failed to generate response with context", error=str(e), elapsed_time=elapsed_time)
            raise e

    def retrieve_context(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Retrieve context for a query - method expected by OpenRouter agent
        """
        try:
            # Generate embedding for the query
            query_embedding = self._get_embedding(query)

            # Search in Qdrant
            sources = self.qdrant_service.search(query_embedding, limit=top_k)

            # Format context from sources
            context = "\n\n".join([source["content"] for source in sources]) if sources else ""

            result = {
                "context": context,
                "sources": sources
            }

            logger.info("Context retrieval completed", query=query[:50] + "..." if len(query) > 50 else query, result_count=len(sources))
            return result
        except Exception as e:
            logger.error("Context retrieval failed", error=str(e), query=query[:50] + "..." if len(query) > 50 else query)
            raise e

    def search_qdrant_with_query(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Enhanced search method that takes a query string and returns relevant sources
        """
        try:
            # Generate embedding for the query
            query_embedding = self._get_embedding(query)

            # Search in Qdrant
            sources = self.qdrant_service.search(query_embedding, limit=limit)

            logger.info("Qdrant search with query completed", query=query[:50] + "..." if len(query) > 50 else query, result_count=len(sources))
            return sources
        except Exception as e:
            logger.error("Enhanced Qdrant search failed", error=str(e), query=query[:50] + "..." if len(query) > 50 else query)
            raise e

    def _generate_response_with_context(self, query: str, sources: List[Dict[str, Any]]) -> str:
        """
        Generate response with retrieved context - duplicate method - placeholder implementation
        """
        try:
            # Format context from sources
            context = "\n\n".join([source["content"] for source in sources])

            # Create a simple response with the context
            response = f"Based on the following information: {context}\n\nAnswer to your question '{query}': This is a placeholder response. In a real implementation, this would be generated by an LLM with the provided context."

            return response

        except Exception as e:
            logger.error("Failed to generate response with context", error=str(e))
            raise e

    def _calculate_confidence_score(self, sources: List[Dict[str, Any]]) -> float:
        """
        Calculate a confidence score based on the quality of retrieved sources
        """
        if not sources:
            return 0.0

        # Calculate average similarity score
        total_score = sum(source["similarity_score"] for source in sources)
        avg_score = total_score / len(sources)

        # Adjust score based on number of sources and their quality
        # More high-quality sources = higher confidence
        high_quality_sources = sum(1 for source in sources if source["similarity_score"] > 0.5)
        quality_factor = min(high_quality_sources / len(sources), 1.0)

        return min(avg_score * quality_factor, 1.0)


# Global instance
retrieval_service = RetrievalService()