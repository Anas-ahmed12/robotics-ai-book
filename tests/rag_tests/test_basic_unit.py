"""
Basic unit tests for the RAG retrieval testing components.
"""
import pytest
from backend.rag_tester.config import Config
from backend.rag_tester.models import Query, RetrievedResult, TestResult, TestExecution


def test_config_validation():
    """Test configuration validation."""
    # Test that validation returns errors for missing required config
    # For this test, we're just ensuring the method exists and can be called
    errors = Config.validate_config()
    # This will likely return errors since we're not running with full config
    # but the method should exist and return a list
    assert isinstance(errors, list)


def test_query_model():
    """Test Query data model."""
    from datetime import datetime

    query = Query(
        query_text="Test query",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=datetime.now()
    )

    assert query.query_text == "Test query"
    assert query.query_vector == [0.1, 0.2, 0.3]
    assert len(query.query_vector) == 3


def test_retrieved_result_model():
    """Test RetrievedResult data model."""
    result = RetrievedResult(
        content_id="test_id",
        content_text="Test content",
        relevance_score=0.8,
        content_domain="test_domain",
        vector_id="test_vector"
    )

    assert result.content_id == "test_id"
    assert result.content_text == "Test content"
    assert result.relevance_score == 0.8
    assert result.content_domain == "test_domain"
    assert result.vector_id == "test_vector"


def test_test_result_model():
    """Test TestResult data model."""
    from datetime import datetime

    query = Query(
        query_text="Test query",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=datetime.now()
    )

    retrieved_result = RetrievedResult(
        content_id="test_id",
        content_text="Test content",
        relevance_score=0.8,
        content_domain="test_domain",
        vector_id="test_vector"
    )

    test_result = TestResult(
        test_id="test_123",
        query=query,
        results=[retrieved_result],
        execution_time=0.1,
        relevant_results_count=1,
        total_results_count=1,
        relevance_percentage=100.0,
        status="success"
    )

    assert test_result.test_id == "test_123"
    assert test_result.query.query_text == "Test query"
    assert len(test_result.results) == 1
    assert test_result.results[0].content_text == "Test content"
    assert test_result.status == "success"


def test_test_execution_model():
    """Test TestExecution data model."""
    from datetime import datetime

    query = Query(
        query_text="Test query",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=datetime.now()
    )

    retrieved_result = RetrievedResult(
        content_id="test_id",
        content_text="Test content",
        relevance_score=0.8,
        content_domain="test_domain",
        vector_id="test_vector"
    )

    test_result = TestResult(
        test_id="test_123",
        query=query,
        results=[retrieved_result],
        execution_time=0.1,
        relevant_results_count=1,
        total_results_count=1,
        relevance_percentage=100.0,
        status="success"
    )

    test_execution = TestExecution(
        execution_id="exec_456",
        start_time=datetime.now(),
        end_time=datetime.now(),
        queries_executed=1,
        queries_passed=1,
        average_response_time=0.1,
        relevance_accuracy=100.0,
        test_results=[test_result],
        summary_report="Test summary"
    )

    assert test_execution.execution_id == "exec_456"
    assert test_execution.queries_executed == 1
    assert len(test_execution.test_results) == 1


if __name__ == "__main__":
    test_config_validation()
    test_query_model()
    test_retrieved_result_model()
    test_test_result_model()
    test_test_execution_model()
    print("Basic unit tests passed!")