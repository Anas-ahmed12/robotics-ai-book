from typing import List
from .models import TestResult, RetrievedResult


class RetrievalValidator:
    """Module for validating retrieval accuracy and relevance."""

    def __init__(self):
        """Initialize the retrieval validator."""
        pass

    def calculate_relevance_percentage(self, test_result: TestResult, threshold: float = 0.7) -> float:
        """
        Calculate the percentage of relevant results in a test result.

        Args:
            test_result: The test result to evaluate
            threshold: Minimum relevance score to consider results relevant

        Returns:
            Percentage of relevant results (0-100)
        """
        if not test_result.results:
            return 0.0

        relevant_count = sum(1 for result in test_result.results if result.relevance_score >= threshold)
        total_count = len(test_result.results)

        return (relevant_count / total_count) * 100

    def validate_semantic_relevance(self, retrieved_results: List[RetrievedResult], query_text: str, threshold: float = 0.7) -> List[bool]:
        """
        Validate semantic relevance of retrieved results to the query.

        Args:
            retrieved_results: List of retrieved results to validate
            query_text: The original query text
            threshold: Minimum relevance score threshold

        Returns:
            List of boolean values indicating if each result is semantically relevant
        """
        relevance_flags = []
        for result in retrieved_results:
            # Check if the relevance score meets the threshold
            is_relevant = result.relevance_score >= threshold
            relevance_flags.append(is_relevant)

        return relevance_flags

    def calculate_performance_metrics(self, test_results: List[TestResult]) -> dict:
        """
        Calculate performance metrics across multiple test results.

        Args:
            test_results: List of test results to analyze

        Returns:
            Dictionary containing performance metrics
        """
        if not test_results:
            return {
                'average_response_time': 0,
                'min_response_time': 0,
                'max_response_time': 0,
                'average_relevance_score': 0,
                'queries_processed': 0
            }

        response_times = [tr.execution_time for tr in test_results]
        relevance_scores = []
        for tr in test_results:
            for result in tr.results:
                relevance_scores.append(result.relevance_score)

        return {
            'average_response_time': sum(response_times) / len(response_times),
            'min_response_time': min(response_times),
            'max_response_time': max(response_times),
            'average_relevance_score': sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0,
            'queries_processed': len(test_results)
        }

    def calculate_accuracy_metrics(self, test_results: List[TestResult], threshold: float = 0.7) -> dict:
        """
        Calculate accuracy metrics for retrieval validation.

        Args:
            test_results: List of test results to analyze
            threshold: Minimum relevance score threshold

        Returns:
            Dictionary containing accuracy metrics
        """
        if not test_results:
            return {
                'overall_relevance_percentage': 0,
                'queries_meeting_threshold': 0,
                'total_queries': 0,
                'accuracy_percentage': 0
            }

        total_results = 0
        relevant_results = 0
        queries_meeting_threshold = 0

        for tr in test_results:
            query_relevance_percentage = self.calculate_relevance_percentage(tr, threshold)
            if query_relevance_percentage >= 80:  # At least 80% of results should be relevant
                queries_meeting_threshold += 1

            total_results += len(tr.results)
            relevant_results += sum(1 for r in tr.results if r.relevance_score >= threshold)

        overall_relevance_percentage = (relevant_results / total_results * 100) if total_results > 0 else 0
        accuracy_percentage = (queries_meeting_threshold / len(test_results) * 100) if test_results else 0

        return {
            'overall_relevance_percentage': overall_relevance_percentage,
            'queries_meeting_threshold': queries_meeting_threshold,
            'total_queries': len(test_results),
            'accuracy_percentage': accuracy_percentage
        }

    def validate_content_domains(self, retrieved_results: List[RetrievedResult]) -> dict:
        """
        Validate content domains for each result.

        Args:
            retrieved_results: List of retrieved results

        Returns:
            Dictionary with domain distribution and validation results
        """
        domain_counts = {}
        for result in retrieved_results:
            domain = result.content_domain
            if domain in domain_counts:
                domain_counts[domain] += 1
            else:
                domain_counts[domain] = 1

        return {
            'domain_distribution': domain_counts,
            'unique_domains': len(domain_counts),
            'total_results': len(retrieved_results)
        }