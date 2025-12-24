from typing import List, Dict, Any
from datetime import datetime
import time
import uuid

from .qdrant_connector import QdrantConnector
from .embedding_service import EmbeddingService
from .results_logger import ResultsLogger
from .models import Query, RetrievedResult, TestResult, TestExecution


class TestRunner:
    """Module for executing test queries against the retrieval pipeline."""

    def __init__(
        self,
        qdrant_connector: QdrantConnector,
        embedding_service: EmbeddingService,
        results_logger: ResultsLogger
    ):
        """Initialize the test runner with required services."""
        self.qdrant_connector = qdrant_connector
        self.embedding_service = embedding_service
        self.results_logger = results_logger

    def run_single_test(
        self,
        query_text: str,
        limit: int = 5,
        threshold: float = 0.7
    ) -> TestResult:
        """
        Execute a single test query against the retrieval pipeline.

        Args:
            query_text: The query text to test
            limit: Maximum number of results to return
            threshold: Minimum relevance score to consider results relevant

        Returns:
            TestResult containing the results of the test
        """
        start_time = time.time()
        test_id = f"test_{uuid.uuid4().hex[:8]}"

        # Validate query appropriateness (handle too general or too specific)
        if len(query_text.strip()) < 3:
            # Query too short, likely too general or not meaningful
            error_query = Query(
                query_text=query_text,
                query_vector=[],
                timestamp=datetime.now()
            )
            error_result = TestResult(
                test_id=test_id,
                query=error_query,
                results=[],
                execution_time=time.time() - start_time,
                relevant_results_count=0,
                total_results_count=0,
                relevance_percentage=0,
                status="no_results",
                anomalies=[f"Query too short (< 3 characters): '{query_text}'"]
            )
            return error_result

        if len(query_text) > self.qdrant_connector.config.MAX_QUERY_LENGTH:
            # Query too long, might be too specific or malformed
            error_query = Query(
                query_text=query_text,
                query_vector=[],
                timestamp=datetime.now()
            )
            error_result = TestResult(
                test_id=test_id,
                query=error_query,
                results=[],
                execution_time=time.time() - start_time,
                relevant_results_count=0,
                total_results_count=0,
                relevance_percentage=0,
                status="no_results",
                anomalies=[f"Query too long (> {self.qdrant_connector.config.MAX_QUERY_LENGTH} characters): '{query_text[:50]}...'"]
            )
            return error_result

        try:
            # Create embedding for the query
            query_vector = self.embedding_service.create_embedding(query_text)

            # Create Query object
            query_obj = Query(
                query_text=query_text,
                query_vector=query_vector,
                timestamp=datetime.now()
            )

            # Search in Qdrant
            search_results = self.qdrant_connector.search_vectors(
                query_vector=query_vector,
                limit=limit
            )

            # Convert search results to RetrievedResult objects
            retrieved_results = []
            for result in search_results:
                # The relevance_score from Qdrant is already a cosine similarity score
                relevance_score = result['relevance_score']

                retrieved_result = RetrievedResult(
                    content_id=result['content_id'],
                    content_text=result['content_text'],
                    relevance_score=relevance_score,
                    content_domain=result['content_domain'],
                    vector_id=result['vector_id'],
                    payload=result.get('payload')
                )
                retrieved_results.append(retrieved_result)

            # Group results by content domain for multiple domain queries (FR-015)
            domain_grouped_results = {}
            for result in retrieved_results:
                domain = result.content_domain
                if domain not in domain_grouped_results:
                    domain_grouped_results[domain] = []
                domain_grouped_results[domain].append(result)

            # Calculate metrics
            relevant_results_count = sum(
                1 for r in retrieved_results if r.relevance_score >= threshold
            )
            total_results_count = len(retrieved_results)
            relevance_percentage = (
                (relevant_results_count / total_results_count * 100)
                if total_results_count > 0 else 0
            )

            # Determine status
            if total_results_count == 0:
                status = "no_results"
            else:
                status = "success"

            # Create TestResult
            test_result = TestResult(
                test_id=test_id,
                query=query_obj,
                results=retrieved_results,
                execution_time=time.time() - start_time,
                relevant_results_count=relevant_results_count,
                total_results_count=total_results_count,
                relevance_percentage=relevance_percentage,
                status=status
            )

            return test_result

        except Exception as e:
            # Handle error case
            error_query = Query(
                query_text=query_text,
                query_vector=[],
                timestamp=datetime.now()
            )
            error_result = TestResult(
                test_id=test_id,
                query=error_query,
                results=[],
                execution_time=time.time() - start_time,
                relevant_results_count=0,
                total_results_count=0,
                relevance_percentage=0,
                status="error",
                anomalies=[f"Error during test execution: {str(e)}"]
            )
            return error_result

    def run_test_suite(
        self,
        queries: List[str],
        limit: int = 5,
        threshold: float = 0.7
    ) -> TestExecution:
        """
        Execute a comprehensive test suite with multiple queries.

        Args:
            queries: List of query texts to test
            limit: Maximum number of results to return per query
            threshold: Minimum relevance score to consider results relevant

        Returns:
            TestExecution containing results for all queries
        """
        execution_id = f"exec_{uuid.uuid4().hex[:8]}"
        start_time = datetime.now()

        test_results = []
        successful_queries = 0

        for query_text in queries:
            test_result = self.run_single_test(
                query_text=query_text,
                limit=limit,
                threshold=threshold
            )
            test_results.append(test_result)

            if test_result.status == "success":
                successful_queries += 1

        end_time = datetime.now()

        # Calculate overall metrics
        if test_results:
            total_response_time = sum(tr.execution_time for tr in test_results)
            average_response_time = total_response_time / len(test_results)

            total_relevant = sum(tr.relevant_results_count for tr in test_results)
            total_results = sum(tr.total_results_count for tr in test_results)
            relevance_accuracy = (
                (total_relevant / total_results * 100)
                if total_results > 0 else 0
            )
        else:
            average_response_time = 0
            relevance_accuracy = 0

        # Create summary report
        summary_report = self._generate_summary_report(
            execution_id, start_time, end_time, test_results
        )

        # Create TestExecution
        test_execution = TestExecution(
            execution_id=execution_id,
            start_time=start_time,
            end_time=end_time,
            queries_executed=len(queries),
            queries_passed=successful_queries,
            average_response_time=average_response_time,
            relevance_accuracy=relevance_accuracy,
            test_results=test_results,
            summary_report=summary_report,
            queries=queries
        )

        return test_execution

    def _generate_summary_report(
        self,
        execution_id: str,
        start_time: datetime,
        end_time: datetime,
        test_results: List[TestResult]
    ) -> str:
        """Generate a summary report for the test execution."""
        if not test_results:
            return "No test results to report."

        # Calculate summary metrics
        successful_tests = sum(1 for tr in test_results if tr.status == "success")
        no_result_tests = sum(1 for tr in test_results if tr.status == "no_results")
        error_tests = sum(1 for tr in test_results if tr.status == "error")

        avg_response_time = sum(tr.execution_time for tr in test_results) / len(test_results)
        avg_relevance = sum(tr.relevance_percentage for tr in test_results) / len(test_results)

        # Create summary report
        report = f"""
# Test Execution Summary

- **Execution ID**: {execution_id}
- **Start Time**: {start_time.isoformat()}
- **End Time**: {end_time.isoformat()}
- **Duration**: {end_time - start_time}

## Test Results Overview
- **Total Queries**: {len(test_results)}
- **Successful**: {successful_tests}
- **No Results**: {no_result_tests}
- **Errors**: {error_tests}
- **Success Rate**: {(successful_tests/len(test_results)*100):.2f}%

## Performance Metrics
- **Average Response Time**: {avg_response_time:.2f}s
- **Average Relevance**: {avg_relevance:.2f}%

## Detailed Results
"""
        for i, result in enumerate(test_results):
            report += f"""
### Query {i+1}: {result.query.query_text}
- Status: {result.status}
- Response Time: {result.execution_time:.2f}s
- Relevant Results: {result.relevant_results_count}/{result.total_results_count}
- Relevance: {result.relevance_percentage:.2f}%
"""

        return report