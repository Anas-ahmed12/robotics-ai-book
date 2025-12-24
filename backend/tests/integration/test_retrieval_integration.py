import pytest
import asyncio
from unittest.mock import Mock, patch
from src.services.retrieval_service import RetrievalService
from src.agents.openrouter_agent import robotics_ai_book_assistant


class TestRetrievalIntegration:
    """
    Integration tests for the complete RAG flow
    """

    @pytest.mark.asyncio
    @patch('src.services.retrieval_service.qdrant_service')
    def test_complete_retrieval_flow(self, mock_qdrant_service):
        """
        Test the complete flow: query -> embedding -> Qdrant search -> response generation
        """
        # Setup mock Qdrant service
        mock_qdrant_service.search.return_value = [
            {
                "id": "test_doc_1",
                "content": "This is test content that matches the query.",
                "similarity_score": 0.85,
                "metadata": {"source": "test_document", "type": "faq"}
            }
        ]

        # Create service instance with mocked dependencies
        service = RetrievalService()

        # Test the complete flow
        result = service.retrieve_and_generate("What is robotics?")

        # Assertions
        assert "response" in result
        assert "sources" in result
        assert len(result["sources"]) > 0
        assert result["confidence_score"] >= 0.0 and result["confidence_score"] <= 1.0
        assert isinstance(result["query_id"], str)
        assert isinstance(result["response_id"], str)

    @patch('src.agents.openrouter_agent.httpx')
    @patch('src.agents.openrouter_agent.qdrant_service')
    @patch('src.agents.openrouter_agent.retrieval_service')
    def test_agent_process_query_integration(self, mock_retrieval_service, mock_qdrant_service, mock_httpx):
        """
        Test the agent's process_query method which orchestrates the complete flow
        """
        # Mock the retrieval service
        expected_result = {
            "response": "Test response from the agent",
            "sources": [
                {
                    "id": "test_source_1",
                    "content": "Test source content",
                    "similarity_score": 0.9,
                    "metadata": {"doc_type": "manual"}
                }
            ],
            "query_id": "test_query_123",
            "response_id": "test_response_123",
            "confidence_score": 0.85,
            "query_timestamp": "2023-01-01T00:00:00",
            "session_id": None,
            "user_id": None
        }
        mock_retrieval_service.retrieve_context.return_value = {
            "context": "Test source content",
            "sources": [
                {
                    "id": "test_source_1",
                    "content": "Test source content",
                    "similarity_score": 0.9,
                    "metadata": {"doc_type": "manual"}
                }
            ]
        }

        # Mock the httpx response for OpenRouter API call
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Test response from the agent"
                    }
                }
            ]
        }
        mock_httpx.post.return_value = mock_response

        # Create agent with mocked dependencies
        agent = robotics_ai_book_assistant.__class__.__new__(robotics_ai_book_assistant.__class__)
        agent.qdrant_service = mock_qdrant_service
        agent.retrieval_service = mock_retrieval_service
        agent.base_url = "https://openrouter.ai/api/v1"
        agent.model = "mistralai/devstral-2512:free"

        # Test the method
        result = agent.process_query("Test query for integration")

        # Assertions
        assert result["response"] == "Test response from the agent"
        assert len(result["sources"]) == 1
        assert result["confidence_score"] == 0.85
        assert result["query_id"] == "test_query_123"

    @patch('src.services.retrieval_service.qdrant_service')
    def test_error_handling_in_retrieval_flow(self, mock_qdrant_service):
        """
        Test that errors in the retrieval flow are properly handled
        """
        # Setup mock to raise an exception
        mock_qdrant_service.search.side_effect = Exception("Qdrant search failed")

        # Create service with mocked dependencies
        service = RetrievalService()

        # Should raise an exception when Qdrant search fails
        with pytest.raises(Exception):
            service.retrieve_and_generate("Test query for error handling")