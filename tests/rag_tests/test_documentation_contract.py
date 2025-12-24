"""
Contract test for documentation generation endpoint.

This test verifies that the documentation generation functionality has the expected interface.
"""
import pytest
from backend.rag_tester.results_logger import ResultsLogger


def test_documentation_generation_contract_structure():
    """Test that the documentation generation functionality has the expected interface."""
    results_logger = ResultsLogger()

    # Verify that the results logger has the expected methods for documentation
    assert hasattr(results_logger, 'log_test_results')
    assert hasattr(results_logger, 'log_detailed_results')
    assert hasattr(results_logger, 'log_anomalies')
    assert hasattr(results_logger, 'generate_performance_report')

    # Verify method signatures by checking they exist and are callable
    assert callable(results_logger.log_test_results)
    assert callable(results_logger.log_detailed_results)
    assert callable(results_logger.log_anomalies)
    assert callable(results_logger.generate_performance_report)


if __name__ == "__main__":
    test_documentation_generation_contract_structure()
    print("Documentation generation contract tests passed!")