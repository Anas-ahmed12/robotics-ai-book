"""
Integration test for report generation.

This test verifies that comprehensive documentation is generated correctly.
"""
import os
import tempfile
import json
from datetime import datetime
from backend.rag_tester.results_logger import ResultsLogger
from backend.rag_tester.models import Query, RetrievedResult, TestResult, TestExecution


def test_markdown_report_generation():
    """Test that comprehensive test reports are generated in Markdown format."""
    # Create a temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        logger = ResultsLogger(output_dir=temp_dir)

        # Create test data
        query = Query(
            query_text="What is ROS2?",
            query_vector=[0.1, 0.2, 0.3],
            timestamp=datetime.now()
        )

        result = RetrievedResult(
            content_id="1",
            content_text="ROS2 is a robotics framework",
            relevance_score=0.8,
            content_domain="robotics",
            vector_id="vec1"
        )

        test_result = TestResult(
            test_id="test_123",
            query=query,
            results=[result],
            execution_time=0.1,
            relevant_results_count=1,
            total_results_count=1,
            relevance_percentage=100.0,
            status="success"
        )

        test_execution_data = {
            'execution_id': 'exec_456',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'queries_executed': 1,
            'queries_passed': 1,
            'average_response_time': 0.1,
            'relevance_accuracy': 100.0,
            'test_results': [
                {
                    'test_id': test_result.test_id,
                    'query': {
                        'query_text': test_result.query.query_text,
                        'timestamp': test_result.query.timestamp.isoformat()
                    },
                    'results': [
                        {
                            'content_id': r.content_id,
                            'content_text': r.content_text,
                            'relevance_score': r.relevance_score,
                            'content_domain': r.content_domain,
                            'vector_id': r.vector_id
                        } for r in test_result.results
                    ],
                    'execution_time': test_result.execution_time,
                    'relevant_results_count': test_result.relevant_results_count,
                    'total_results_count': test_result.total_results_count,
                    'relevance_percentage': test_result.relevance_percentage,
                    'status': test_result.status,
                    'anomalies': test_result.anomalies
                }
            ],
            'summary_report': 'Test execution completed successfully'
        }

        # Generate the report
        report_path = logger.log_test_results(test_execution_data)

        # Verify the report was created
        assert os.path.exists(report_path)
        assert report_path.endswith('.md')

        # Verify the report contains expected content
        with open(report_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert "# RAG Retrieval Pipeline Test Report" in content
            assert "Execution Summary" in content
            assert "Test Results" in content
            assert "What is ROS2?" in content


def test_json_results_generation():
    """Test that detailed results are generated in JSON format."""
    # Create a temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        logger = ResultsLogger(output_dir=temp_dir)

        test_execution_data = {
            'execution_id': 'exec_456',
            'start_time': datetime.now().isoformat(),
            'end_time': datetime.now().isoformat(),
            'queries_executed': 1,
            'queries_passed': 1,
            'average_response_time': 0.1,
            'relevance_accuracy': 100.0,
            'test_results': [],
            'summary_report': 'Test execution completed successfully'
        }

        # Generate detailed results
        json_path = logger.log_detailed_results(test_execution_data)

        # Verify the JSON file was created
        assert os.path.exists(json_path)
        assert json_path.endswith('.json')

        # Verify the JSON contains expected data
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            assert data['execution_id'] == 'exec_456'
            assert data['queries_executed'] == 1


def test_anomalies_logging():
    """Test that anomalies are logged to a separate file."""
    # Create a temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        logger = ResultsLogger(output_dir=temp_dir)

        anomalies = ["Anomaly 1: Low relevance score detected", "Anomaly 2: Unexpected content domain"]

        # Log anomalies
        anomalies_path = logger.log_anomalies(anomalies)

        # Verify the anomalies file was created if there are anomalies
        if anomalies:
            assert anomalies_path is not None
            assert os.path.exists(anomalies_path)
            assert anomalies_path.endswith('.txt')

            # Verify the anomalies are in the file
            with open(anomalies_path, 'r', encoding='utf-8') as f:
                content = f.read()
                assert "Anomaly 1: Low relevance score detected" in content
                assert "Anomaly 2: Unexpected content domain" in content


if __name__ == "__main__":
    test_markdown_report_generation()
    test_json_results_generation()
    test_anomalies_logging()
    print("Documentation generation integration tests passed!")