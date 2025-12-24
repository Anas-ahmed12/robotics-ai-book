import json
import os
from datetime import datetime
from typing import Dict, Any, List
import pandas as pd


class ResultsLogger:
    """Module for logging test results and generating reports."""

    def __init__(self, output_dir: str = "test_results"):
        """Initialize the results logger with output directory."""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def log_test_results(self, test_execution_data: Dict[str, Any]) -> str:
        """
        Log comprehensive test results to a markdown report.

        Args:
            test_execution_data: Complete test execution data including results, metrics, etc.

        Returns:
            Path to the generated report file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_filename = f"test_report_{timestamp}.md"
        report_path = os.path.join(self.output_dir, report_filename)

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# RAG Retrieval Pipeline Test Report\n\n")
            f.write(f"**Generated**: {datetime.now().isoformat()}\n\n")

            # Execution Summary
            f.write("## Execution Summary\n\n")
            f.write(f"- **Execution ID**: {test_execution_data.get('execution_id', 'N/A')}\n")
            f.write(f"- **Start Time**: {test_execution_data.get('start_time', 'N/A')}\n")
            f.write(f"- **End Time**: {test_execution_data.get('end_time', 'N/A')}\n")
            f.write(f"- **Queries Executed**: {test_execution_data.get('queries_executed', 0)}\n")
            f.write(f"- **Queries Passed**: {test_execution_data.get('queries_passed', 0)}\n")
            f.write(f"- **Average Response Time**: {test_execution_data.get('average_response_time', 0):.2f}s\n")
            f.write(f"- **Relevance Accuracy**: {test_execution_data.get('relevance_accuracy', 0):.2f}%\n")
            f.write(f"- **Status**: {test_execution_data.get('status', 'N/A')}\n\n")

            # Methodology Section
            f.write("## Methodology\n\n")
            f.write("The RAG retrieval pipeline was tested using sample queries against the Qdrant vector database.\n")
            f.write("Each query was executed and the returned results were evaluated for relevance and accuracy.\n\n")

            # Test Results
            f.write("## Test Results\n\n")
            test_results = test_execution_data.get('test_results', [])
            for i, result in enumerate(test_results):
                f.write(f"### Query {i+1}: {result.get('query', {}).get('query_text', 'N/A')}\n\n")
                f.write(f"- **Execution Time**: {result.get('execution_time', 0):.2f}s\n")
                f.write(f"- **Relevant Results**: {result.get('relevant_results_count', 0)}\n")
                f.write(f"- **Total Results**: {result.get('total_results_count', 0)}\n")
                f.write(f"- **Relevance Percentage**: {result.get('relevance_percentage', 0):.2f}%\n")
                f.write(f"- **Status**: {result.get('status', 'N/A')}\n\n")

                # Detailed results
                f.write("#### Detailed Results:\n")
                results = result.get('results', [])
                for j, res in enumerate(results):
                    f.write(f"  - Result {j+1}: Score {res.get('relevance_score', 0):.3f}, Domain: {res.get('content_domain', 'N/A')}\n")
                    f.write(f"    Content: {res.get('content_text', '')[:100]}...\n\n")

            # Anomalies
            anomalies = test_execution_data.get('anomalies', [])
            if anomalies:
                f.write("## Anomalies\n\n")
                for i, anomaly in enumerate(anomalies):
                    f.write(f"{i+1}. {anomaly}\n")

            # Summary
            f.write("## Summary\n\n")
            f.write(test_execution_data.get('summary_report', 'No summary provided'))

        return report_path

    def log_detailed_results(self, test_execution_data: Dict[str, Any]) -> str:
        """
        Log detailed test results in JSON format for analysis.

        Args:
            test_execution_data: Complete test execution data

        Returns:
            Path to the generated JSON file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"detailed_results_{timestamp}.json"
        json_path = os.path.join(self.output_dir, json_filename)

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(test_execution_data, f, indent=2, default=str)

        return json_path

    def log_anomalies(self, anomalies: List[str]) -> str:
        """
        Log anomalies to a separate file.

        Args:
            anomalies: List of anomaly descriptions

        Returns:
            Path to the generated anomalies file
        """
        if not anomalies:
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        anomalies_filename = f"anomalies_{timestamp}.txt"
        anomalies_path = os.path.join(self.output_dir, anomalies_filename)

        with open(anomalies_path, 'w', encoding='utf-8') as f:
            for anomaly in anomalies:
                f.write(f"{anomaly}\n")

        return anomalies_path

    def generate_performance_report(self, test_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate performance metrics from test results.

        Args:
            test_results: List of individual test results

        Returns:
            Dictionary with performance metrics
        """
        if not test_results:
            return {}

        execution_times = [result.get('execution_time', 0) for result in test_results]
        relevance_percentages = [result.get('relevance_percentage', 0) for result in test_results]
        statuses = [result.get('status', '') for result in test_results]

        performance_metrics = {
            'average_response_time': sum(execution_times) / len(execution_times) if execution_times else 0,
            'min_response_time': min(execution_times) if execution_times else 0,
            'max_response_time': max(execution_times) if execution_times else 0,
            'average_relevance_percentage': sum(relevance_percentages) / len(relevance_percentages) if relevance_percentages else 0,
            'success_rate': statuses.count('success') / len(statuses) * 100 if statuses else 0,
            'total_tests': len(test_results),
            'successful_tests': statuses.count('success'),
            'failed_tests': len([s for s in statuses if s == 'error']),
            'no_result_tests': len([s for s in statuses if s == 'no_results'])
        }

        return performance_metrics