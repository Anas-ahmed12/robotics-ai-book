import pytest
from unittest.mock import Mock, patch, MagicMock
from src.services.qdrant_service import QdrantService
from src.config.settings import settings


class TestQdrantService:
    """
    Unit tests for the QdrantService class
    """

    def setup_method(self):
        """Setup method to create a test instance of QdrantService"""
        # Mock the QdrantClient to avoid actual connections
        with patch('src.services.qdrant_service.QdrantClient') as mock_client:
            self.service = QdrantService()

    @patch('src.services.qdrant_service.QdrantClient')
    def test_health_check_success(self, mock_qdrant_client):
        """Test health check when Qdrant is accessible"""
        # Mock the client methods
        mock_instance = Mock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collection.return_value = Mock()

        # Create service with mocked client
        service = QdrantService()
        result = service.health_check()

        assert result is True

    @patch('src.services.qdrant_service.QdrantClient')
    def test_health_check_failure(self, mock_qdrant_client):
        """Test health check when Qdrant is not accessible"""
        # Mock the client to raise an exception
        mock_instance = Mock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collection.side_effect = Exception("Connection failed")

        # Create service with mocked client
        service = QdrantService()
        result = service.health_check()

        assert result is False

    @patch('src.services.qdrant_service.QdrantClient')
    def test_is_available_success(self, mock_qdrant_client):
        """Test is_available when Qdrant is accessible"""
        mock_instance = Mock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collection.return_value = Mock()

        service = QdrantService()
        result = service.is_available()

        assert result is True

    @patch('src.services.qdrant_service.QdrantClient')
    def test_is_available_failure(self, mock_qdrant_client):
        """Test is_available when Qdrant is not accessible"""
        mock_instance = Mock()
        mock_qdrant_client.return_value = mock_instance
        mock_instance.get_collection.side_effect = Exception("Connection failed")

        service = QdrantService()
        result = service.is_available()

        assert result is False