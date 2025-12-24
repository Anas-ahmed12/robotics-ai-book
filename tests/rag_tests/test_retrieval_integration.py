"""
Integration test for basic query execution.

This test verifies that the retrieval pipeline works end-to-end.
"""
import pytest
from unittest.mock import Mock, patch
from backend.rag_tester.qdrant_connector import QdrantConnector
from backend.rag_tester.embedding_service import EmbeddingService
from backend.rag_tester.test_runner import TestRunner
from backend.rag_tester.results_logger import ResultsLogger


@patch('backend.rag_tester.qdrant_connector.QdrantClient')
def test_basic_query_execution_integration(mock_qdrant_client):
    """Test that basic query execution works end-to-end."""
    # Mock the Qdrant client
    mock_client_instance = Mock()
    mock_qdrant_client.return_value = mock_client_instance
    mock_client_instance.get_collections.return_value = Mock()

    # Mock the search response
    mock_search_result = Mock()
    mock_search_result.id = "test_id_1"
    mock_search_result.score = 0.85
    mock_search_result.payload = {
        "content": "This is a test content for robotics",
        "domain": "robotics"
    }

    mock_client_instance.search.return_value = [mock_search_result]

    # Initialize components
    qdrant_connector = QdrantConnector()
    embedding_service = EmbeddingService()

    # Mock the embedding service to return a fixed embedding
    embedding_service.create_embedding = Mock(return_value=[0.1, 0.2, 0.3, 0.4, 0.5])

    results_logger = ResultsLogger()
    test_runner = TestRunner(qdrant_connector, embedding_service, results_logger)

    # Execute a test query
    test_result = test_runner.run_single_test(
        query_text="What is ROS2?",
        limit=5,
        threshold=0.7
    )

    # Verify the result
    assert test_result is not None
    assert test_result.query.query_text == "What is ROS2?"
    assert test_result.status == "success"
    assert len(test_result.results) == 1
    assert test_result.results[0].relevance_score == 0.85
    assert test_result.results[0].content_domain == "robotics"


@patch('backend.rag_tester.qdrant_connector.QdrantClient')
def test_multiple_query_execution(mock_qdrant_client):
    """Test that multiple queries can be executed in a test suite."""
    # Mock the Qdrant client
    mock_client_instance = Mock()
    mock_qdrant_client.return_value = mock_client_instance
    mock_client_instance.get_collections.return_value = Mock()

    # Mock the search response
    mock_search_result = Mock()
    mock_search_result.id = "test_id_1"
    mock_search_result.score = 0.85
    mock_search_result.payload = {
        "content": "This is a test content for robotics",
        "domain": "robotics"
    }

    mock_client_instance.search.return_value = [mock_search_result]

    # Initialize components
    qdrant_connector = QdrantConnector()
    embedding_service = EmbeddingService()

    # Mock the embedding service to return a fixed embedding
    embedding_service.create_embedding = Mock(return_value=[0.1, 0.2, 0.3, 0.4, 0.5])

    results_logger = ResultsLogger()
    test_runner = TestRunner(qdrant_connector, embedding_service, results_logger)

    # Execute multiple test queries
    test_queries = ["What is ROS2?", "Explain reinforcement learning"]
    execution_result = test_runner.run_test_suite(
        queries=test_queries,
        limit=5,
        threshold=0.7
    )

    # Verify the execution result
    assert execution_result is not None
    assert execution_result.queries_executed == 2
    assert len(execution_result.test_results) == 2
    assert execution_result.queries_passed == 2  # Both should be successful
    assert execution_result.relevance_accuracy >= 0  # Should have some relevance


if __name__ == "__main__":
    import unittest
    unittest.main()