"""
Integration test for relevance validation.

This test verifies that the retrieval accuracy validation works correctly.
"""
import pytest
from unittest.mock import Mock
from backend.rag_tester.models import Query, RetrievedResult, TestResult
from backend.rag_tester.retrieval_validator import RetrievalValidator


def test_relevance_percentage_calculation():
    """Test that relevance percentage is calculated correctly."""
    validator = RetrievalValidator()

    # Create mock test result with some relevant and some irrelevant results
    query = Query(
        query_text="What is ROS2?",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=__import__('datetime').datetime.now()
    )

    results = [
        RetrievedResult(
            content_id="1",
            content_text="ROS2 is a robotics framework",
            relevance_score=0.8,  # Relevant (above 0.7 threshold)
            content_domain="robotics",
            vector_id="vec1"
        ),
        RetrievedResult(
            content_id="2",
            content_text="Machine learning basics",
            relevance_score=0.3,  # Irrelevant (below 0.7 threshold)
            content_domain="AI",
            vector_id="vec2"
        ),
        RetrievedResult(
            content_id="3",
            content_text="Advanced robotics concepts",
            relevance_score=0.9,  # Relevant (above 0.7 threshold)
            content_domain="robotics",
            vector_id="vec3"
        )
    ]

    test_result = TestResult(
        test_id="test_123",
        query=query,
        results=results,
        execution_time=0.1,
        relevant_results_count=2,
        total_results_count=3,
        relevance_percentage=66.67,
        status="success"
    )

    # Calculate relevance percentage with 0.7 threshold
    percentage = validator.calculate_relevance_percentage(test_result, threshold=0.7)

    # Should be 2 out of 3 results relevant = 66.67%
    assert abs(percentage - 66.67) < 0.01


def test_semantic_relevance_validation():
    """Test semantic relevance validation."""
    validator = RetrievalValidator()

    results = [
        RetrievedResult(
            content_id="1",
            content_text="ROS2 is a robotics framework",
            relevance_score=0.8,
            content_domain="robotics",
            vector_id="vec1"
        ),
        RetrievedResult(
            content_id="2",
            content_text="Machine learning basics",
            relevance_score=0.3,
            content_domain="AI",
            vector_id="vec2"
        )
    ]

    relevance_flags = validator.validate_semantic_relevance(results, "What is ROS2?", threshold=0.7)

    # First result should be relevant (0.8 > 0.7), second should not be (0.3 < 0.7)
    assert relevance_flags == [True, False]


def test_performance_metrics_calculation():
    """Test performance metrics calculation."""
    validator = RetrievalValidator()

    query = Query(
        query_text="What is ROS2?",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=__import__('datetime').datetime.now()
    )

    result1 = RetrievedResult(
        content_id="1",
        content_text="ROS2 is a robotics framework",
        relevance_score=0.8,
        content_domain="robotics",
        vector_id="vec1"
    )

    result2 = RetrievedResult(
        content_id="2",
        content_text="Another robotics concept",
        relevance_score=0.6,
        content_domain="robotics",
        vector_id="vec2"
    )

    test_result1 = TestResult(
        test_id="test_123",
        query=query,
        results=[result1],
        execution_time=0.1,
        relevant_results_count=1,
        total_results_count=1,
        relevance_percentage=100.0,
        status="success"
    )

    test_result2 = TestResult(
        test_id="test_456",
        query=query,
        results=[result2],
        execution_time=0.2,
        relevant_results_count=0,
        total_results_count=1,
        relevance_percentage=0.0,
        status="success"
    )

    metrics = validator.calculate_performance_metrics([test_result1, test_result2])

    assert metrics['average_response_time'] == 0.15  # (0.1 + 0.2) / 2
    assert metrics['min_response_time'] == 0.1
    assert metrics['max_response_time'] == 0.2
    assert metrics['queries_processed'] == 2


def test_accuracy_metrics_calculation():
    """Test accuracy metrics calculation."""
    validator = RetrievalValidator()

    query = Query(
        query_text="What is ROS2?",
        query_vector=[0.1, 0.2, 0.3],
        timestamp=__import__('datetime').datetime.now()
    )

    # Create test results where the first meets the 80% threshold and the second doesn't
    result1 = RetrievedResult(
        content_id="1",
        content_text="ROS2 is a robotics framework",
        relevance_score=0.8,
        content_domain="robotics",
        vector_id="vec1"
    )

    result2 = RetrievedResult(
        content_id="2",
        content_text="Another robotics concept",
        relevance_score=0.3,
        content_domain="robotics",
        vector_id="vec2"
    )

    test_result1 = TestResult(
        test_id="test_123",
        query=query,
        results=[result1, result2],  # 1 out of 2 relevant (50%) - doesn't meet 80% threshold
        execution_time=0.1,
        relevant_results_count=1,
        total_results_count=2,
        relevance_percentage=50.0,
        status="success"
    )

    metrics = validator.calculate_accuracy_metrics([test_result1], threshold=0.7)

    # With 0.7 threshold, 1 out of 2 results are relevant = 50% overall relevance
    # Since 50% < 80%, this query doesn't meet the 80% threshold
    assert metrics['overall_relevance_percentage'] == 50.0
    assert metrics['queries_meeting_threshold'] == 0  # Doesn't meet 80% threshold
    assert metrics['total_queries'] == 1
    assert metrics['accuracy_percentage'] == 0.0  # 0 out of 1 queries meet 80% threshold


if __name__ == "__main__":
    test_relevance_percentage_calculation()
    test_semantic_relevance_validation()
    test_performance_metrics_calculation()
    test_accuracy_metrics_calculation()
    print("Accuracy validation integration tests passed!")