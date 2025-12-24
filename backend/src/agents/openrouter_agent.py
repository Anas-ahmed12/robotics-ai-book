import structlog
from typing import Dict, Any, Optional
import httpx
import json
from src.config.settings import settings
from src.services.qdrant_service import qdrant_service
from src.services.retrieval_service import retrieval_service
import uuid
from datetime import datetime


logger = structlog.get_logger(__name__)


class RoboticsAIBookAssistant:
    """
    Agent class to handle Robotics AI Book queries using OpenRouter API and Qdrant
    Implements the RAG (Retrieval-Augmented Generation) pattern for book-specific responses
    """

    def __init__(self):
        self.qdrant_service = qdrant_service
        self.retrieval_service = retrieval_service
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "mistralai/devstral-2512:free"
        logger.info("RoboticsAIBookAssistant initialized with OpenRouter and Qdrant integration")

    def process_query(self, query: str, session_id: Optional[str] = None,
                     user_id: Optional[str] = None, temperature: float = 0.7) -> Dict[str, Any]:
        """
        Process a user query and return a response with relevant sources
        This implements the RAG flow: query -> retrieve context -> generate response
        """
        query_id = str(uuid.uuid4())
        logger.info("Starting query processing", query_id=query_id, query_length=len(query),
                   session_id=session_id, user_id=user_id)

        try:
            # Use the retrieval service to get context
            context_result = self.retrieval_service.retrieve_context(query, top_k=3)
            context = context_result.get('context', '')

            # Prepare the prompt with context and strict book-focused instructions
            if context:
                full_prompt = f"""You are a professional Robotics AI Book Assistant. Your responses must adhere to the following guidelines:

1. ANSWER ONLY using the Robotics AI Book content provided in the context below.
2. If the answer is not present in the provided context, clearly state: "This information is not available in the book."
3. Do not generate generic AI answers, assumptions, opinions, or external knowledge.
4. Keep your response educational, precise, and strictly book-focused.
5. Maintain an academic and informative tone.

CONTEXT FROM ROBOTICS AI BOOK:
{context}

QUESTION: {query}

ANSWER (based ONLY on the above context):"""
            else:
                full_prompt = f"""You are a professional Robotics AI Book Assistant. Your responses must adhere to the following guidelines:

1. ANSWER ONLY using the Robotics AI Book content provided in the context below.
2. If the answer is not present in the provided context, clearly state: "This information is not available in the book."
3. Do not generate generic AI answers, assumptions, opinions, or external knowledge.
4. Keep your response educational, precise, and strictly book-focused.
5. Maintain an academic and informative tone.

NO CONTEXT AVAILABLE: The Robotics AI Book does not contain information related to this query.

RESPONSE: This information is not available in the book.

Question: {query}"""

            # Call OpenRouter API
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                "temperature": temperature
            }

            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )

            if response.status_code != 200:
                logger.error("OpenRouter API call failed", status_code=response.status_code, response_text=response.text)
                raise Exception(f"OpenRouter API call failed with status {response.status_code}: {response.text}")

            response_data = response.json()
            ai_response = response_data['choices'][0]['message']['content']

            # Add additional metadata to the result
            result = {
                "response": ai_response,
                "sources": context_result.get('sources', []),
                "query_id": query_id,
                "session_id": session_id,
                "user_id": user_id,
                "query_timestamp": datetime.utcnow().isoformat(),
                "confidence_score": 0.8  # Default confidence score
            }

            logger.info("Query processed successfully", query_id=query_id)
            return result

        except Exception as e:
            logger.error("Error processing query", query_id=query_id, error=str(e), query=query[:50] + "..." if len(query) > 50 else query)
            raise e

    def health_check(self) -> Dict[str, Any]:
        """
        Check the health of the agent and its dependencies
        """
        try:
            # Check Qdrant connectivity
            qdrant_healthy = self.qdrant_service.health_check()

            # Check OpenRouter connectivity by making a simple request
            openrouter_healthy = False
            try:
                headers = {
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "user",
                            "content": "health check"
                        }
                    ],
                    "max_tokens": 5
                }

                response = httpx.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )

                openrouter_healthy = response.status_code == 200
            except Exception:
                openrouter_healthy = False

            status = "healthy" if (qdrant_healthy and openrouter_healthy) else "degraded"

            health_info = {
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "qdrant": {
                        "status": "up" if qdrant_healthy else "down",
                        "response_time": None  # In a real implementation, measure response time
                    },
                    "openrouter": {
                        "status": "up" if openrouter_healthy else "down",
                        "response_time": None  # In a real implementation, measure response time
                    }
                },
                "version": "1.0.0"
            }

            logger.info("Health check completed", status=status)
            return health_info

        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return {
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "services": {
                    "qdrant": {"status": "down", "response_time": None},
                    "openrouter": {"status": "down", "response_time": None}
                },
                "version": "1.0.0"
            }


# Global instance
robotics_ai_book_assistant = RoboticsAIBookAssistant()