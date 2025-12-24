from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime


@dataclass
class Query:
    """A search request containing text that will be converted to embeddings for similarity matching."""
    query_text: str
    query_vector: List[float]
    timestamp: datetime
    execution_time_ms: Optional[float] = None


@dataclass
class RetrievedResult:
    """Original text chunks or documents that match the query based on vector similarity."""
    content_id: str
    content_text: str
    relevance_score: float  # Cosine similarity score (0.0-1.0)
    content_domain: str  # Domain category (e.g., "robotics", "AI", "programming")
    vector_id: str
    payload: Optional[Dict[str, Any]] = None


@dataclass
class TestResult:
    """Results for a single test query execution."""
    test_id: str
    query: Query
    results: List[RetrievedResult]
    execution_time: float  # Total time in seconds
    relevant_results_count: int
    total_results_count: int
    relevance_percentage: float  # (relevant_results_count / total_results_count * 100)
    status: str  # "success", "no_results", or "error"
    anomalies: List[str] = None

    def __post_init__(self):
        if self.anomalies is None:
            self.anomalies = []


@dataclass
class TestExecution:
    """A complete test execution session."""
    execution_id: str
    start_time: datetime
    end_time: datetime
    queries_executed: int
    queries_passed: int
    average_response_time: float  # Average across all queries
    relevance_accuracy: float  # Overall percentage across all queries
    test_results: List[TestResult]
    summary_report: str
    queries: List[str] = None  # List of query texts executed

    def __post_init__(self):
        if self.queries is None:
            self.queries = []

    @property
    def success_rate(self) -> float:
        """Calculate the success rate of queries."""
        if self.queries_executed == 0:
            return 0.0
        return (self.queries_passed / self.queries_executed) * 100

    @property
    def total_anomalies(self) -> int:
        """Calculate the total number of anomalies across all test results."""
        total = 0
        for test_result in self.test_results:
            total += len(test_result.anomalies)
        return total