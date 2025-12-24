"""
Contract test for validation metrics endpoint.

This test verifies that the accuracy validation functionality has the expected interface.
"""
import pytest
from backend.rag_tester.qdrant_connector import QdrantConnector
from backend.rag_tester.embedding_service import EmbeddingService
from backend.rag_tester.test_runner import TestRunner
from backend.rag_tester.results_logger import ResultsLogger
from backend.rag_tester.retrieval_validator import RetrievalValidator


def test_accuracy_validation_contract_structure():
    """Test that the accuracy validation functionality has the expected interface."""
    # Initialize components
    qdrant_connector = QdrantConnector()
    embedding_service = EmbeddingService()
    results_logger = ResultsLogger()
    test_runner = TestRunner(qdrant_connector, embedding_service, results_logger)

    # Initialize the retrieval validator
    retrieval_validator = RetrievalValidator()

    # Verify that the retrieval validator has the expected methods
    assert hasattr(retrieval_validator, 'calculate_relevance_percentage')
    assert hasattr(retrieval_validator, 'validate_semantic_relevance')
    assert hasattr(retrieval_validator, 'calculate_performance_metrics')
    assert hasattr(retrieval_validator, 'calculate_accuracy_metrics')

    # Verify method signatures by checking they exist and are callable
    assert callable(retrieval_validator.calculate_relevance_percentage)
    assert callable(retrieval_validator.validate_semantic_relevance)
    assert callable(retrieval_validator.calculate_performance_metrics)
    assert callable(retrieval_validator.calculate_accuracy_metrics)


if __name__ == "__main__":
    test_accuracy_validation_contract_structure()
    print("Accuracy validation contract tests passed!")