import pytest
from unittest.mock import Mock, patch, MagicMock
from src.services.retrieval_service import RetrievalService
from src.config.settings import settings


class TestRetrievalService:
    """
    Unit tests for the RetrievalService class
    """

    def setup_method(self):
        """Setup method to create a test instance of RetrievalService"""
        with patch('src.services.retrieval_service.OpenAI'), \
             patch('src.services.retrieval_service.qdrant_service'):
            self.service = RetrievalService()

    @patch('src.services.retrieval_service.OpenAI')
    @patch('src.services.retrieval_service.qdrant_service')
    def test_retrieve_and_generate(self, mock_qdrant_service, mock_openai):
        """Test the main retrieval and generation method"""
        # Mock the OpenAI client
        mock_client = Mock()
        mock_openai.return_value = mock_client

        mock_embedding_response = Mock()
        mock_embedding_response.data = [Mock()]
        mock_embedding_response.data[0].embedding = [0.1, 0.2, 0.3]
        mock_client.embeddings.create.return_value = mock_embedding_response

        mock_chat_response = Mock()
        mock_chat_response.choices = [Mock()]
        mock_chat_response.choices[0].message.content = "Test response"
        mock_client.chat.completions.create.return_value = mock_chat_response

        # Mock Qdrant service
        mock_qdrant_service.search.return_value = [
            {
                "id": "test_id",
                "content": "Test content",
                "similarity_score": 0.9,
                "metadata": {}
            }
        ]

        # Call the method
        result = self.service.retrieve_and_generate("Test query")

        # Assertions
        assert "response" in result
        assert "sources" in result
        assert result["response"] == "Test response"
        assert len(result["sources"]) == 1
        assert result["sources"][0]["id"] == "test_id"
        assert result["sources"][0]["content"] == "Test content"

    def test_calculate_confidence_score_with_sources(self):
        """Test confidence score calculation with sources"""
        sources = [
            {"similarity_score": 0.8},
            {"similarity_score": 0.9},
            {"similarity_score": 0.7}
        ]

        confidence = self.service._calculate_confidence_score(sources)

        # Average of 0.8, 0.9, 0.7 = 0.8
        assert confidence == 0.8

    def test_calculate_confidence_score_no_sources(self):
        """Test confidence score calculation with no sources"""
        confidence = self.service._calculate_confidence_score([])
        assert confidence == 0.0