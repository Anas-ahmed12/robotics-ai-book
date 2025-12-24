#!/usr/bin/env python3
"""
Main entry point for the RAG retrieval pipeline testing tool.

This module provides command-line interface for executing test queries against
the Qdrant vector database and validating the retrieval pipeline.
"""

import argparse
import sys
from datetime import datetime
from typing import List

from .config import Config
from .qdrant_connector import QdrantConnector
from .embedding_service import EmbeddingService
from .test_runner import TestRunner
from .results_logger import ResultsLogger
from .models import TestExecution


def main():
    """Main entry point for the RAG retrieval testing tool."""
    parser = argparse.ArgumentParser(
        description="RAG Retrieval Pipeline Testing Tool"
    )
    parser.add_argument(
        "--test-query",
        type=str,
        help="Execute a single test query against the retrieval pipeline"
    )
    parser.add_argument(
        "--run-tests",
        action="store_true",
        help="Run comprehensive test suite with multiple queries"
    )
    parser.add_argument(
        "--queries-file",
        type=str,
        help="Path to a file containing test queries (one per line)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Number of results to return per query (default: 5)"
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.7,
        help="Relevance threshold for considering results relevant (default: 0.7)"
    )

    args = parser.parse_args()

    # Validate configuration
    config_errors = Config.validate_config()
    if config_errors:
        print("Configuration errors found:")
        for error in config_errors:
            print(f"  - {error}")
        sys.exit(1)

    # Initialize components
    qdrant_connector = QdrantConnector()
    embedding_service = EmbeddingService()
    results_logger = ResultsLogger()
    test_runner = TestRunner(qdrant_connector, embedding_service, results_logger)

    # Check Qdrant connection
    if not qdrant_connector.test_connection():
        print("Error: Cannot connect to Qdrant database")
        sys.exit(1)

    print("Connected to Qdrant database successfully")

    # Execute based on arguments
    if args.test_query:
        print(f"Executing test query: '{args.test_query}'")
        result = test_runner.run_single_test(
            query_text=args.test_query,
            limit=args.limit,
            threshold=args.threshold
        )
        print(f"Test completed. Status: {result.status}")
        print(f"Relevance: {result.relevance_percentage:.2f}%")
        print(f"Execution time: {result.execution_time:.2f}s")

    elif args.run_tests:
        print("Running comprehensive test suite...")
        # Default test queries for the comprehensive test
        default_queries = [
            "What is ROS2?",
            "Explain reinforcement learning in robotics",
            "How does computer vision work in autonomous robots?",
            "What are the key features of ROS2?",
            "Describe path planning algorithms"
        ]
        execution_result = test_runner.run_test_suite(
            queries=default_queries,
            limit=args.limit,
            threshold=args.threshold
        )
        _log_execution_results(results_logger, execution_result)

    elif args.queries_file:
        print(f"Running tests from file: {args.queries_file}")
        try:
            with open(args.queries_file, 'r', encoding='utf-8') as f:
                queries = [line.strip() for line in f if line.strip()]
            execution_result = test_runner.run_test_suite(
                queries=queries,
                limit=args.limit,
                threshold=args.threshold
            )
            _log_execution_results(results_logger, execution_result)
        except FileNotFoundError:
            print(f"Error: Queries file '{args.queries_file}' not found")
            sys.exit(1)
        except Exception as e:
            print(f"Error reading queries file: {str(e)}")
            sys.exit(1)

    else:
        # Show help if no arguments provided
        parser.print_help()
        sys.exit(1)


def _log_execution_results(results_logger: ResultsLogger, execution_result: TestExecution):
    """Log the execution results to files."""
    try:
        # Generate and save markdown report
        report_path = results_logger.log_test_results({
            'execution_id': execution_result.execution_id,
            'start_time': execution_result.start_time.isoformat(),
            'end_time': execution_result.end_time.isoformat(),
            'queries_executed': execution_result.queries_executed,
            'queries_passed': execution_result.queries_passed,
            'average_response_time': execution_result.average_response_time,
            'relevance_accuracy': execution_result.relevance_accuracy,
            'status': 'completed',
            'test_results': [
                {
                    'test_id': tr.test_id,
                    'query': {
                        'query_text': tr.query.query_text,
                        'timestamp': tr.query.timestamp.isoformat() if tr.query.timestamp else None
                    },
                    'results': [
                        {
                            'content_id': rr.content_id,
                            'content_text': rr.content_text,
                            'relevance_score': rr.relevance_score,
                            'content_domain': rr.content_domain,
                            'vector_id': rr.vector_id
                        } for rr in tr.results
                    ],
                    'execution_time': tr.execution_time,
                    'relevant_results_count': tr.relevant_results_count,
                    'total_results_count': tr.total_results_count,
                    'relevance_percentage': tr.relevance_percentage,
                    'status': tr.status,
                    'anomalies': tr.anomalies
                } for tr in execution_result.test_results
            ],
            'summary_report': execution_result.summary_report
        })

        # Generate and save detailed JSON results
        detailed_path = results_logger.log_detailed_results({
            'execution_id': execution_result.execution_id,
            'start_time': execution_result.start_time.isoformat(),
            'end_time': execution_result.end_time.isoformat(),
            'queries_executed': execution_result.queries_executed,
            'queries_passed': execution_result.queries_passed,
            'average_response_time': execution_result.average_response_time,
            'relevance_accuracy': execution_result.relevance_accuracy,
            'test_results': [
                {
                    'test_id': tr.test_id,
                    'query': {
                        'query_text': tr.query.query_text,
                        'timestamp': tr.query.timestamp.isoformat() if tr.query.timestamp else None
                    },
                    'results': [
                        {
                            'content_id': rr.content_id,
                            'content_text': rr.content_text,
                            'relevance_score': rr.relevance_score,
                            'content_domain': rr.content_domain,
                            'vector_id': rr.vector_id
                        } for rr in tr.results
                    ],
                    'execution_time': tr.execution_time,
                    'relevant_results_count': tr.relevant_results_count,
                    'total_results_count': tr.total_results_count,
                    'relevance_percentage': tr.relevance_percentage,
                    'status': tr.status,
                    'anomalies': tr.anomalies
                } for tr in execution_result.test_results
            ],
            'summary_report': execution_result.summary_report
        })

        # Log anomalies if any
        all_anomalies = []
        for tr in execution_result.test_results:
            all_anomalies.extend(tr.anomalies)

        if all_anomalies:
            anomalies_path = results_logger.log_anomalies(all_anomalies)
            print(f"Anomalies logged to: {anomalies_path}")

        print(f"Test report generated: {report_path}")
        print(f"Detailed results: {detailed_path}")

    except Exception as e:
        print(f"Error logging results: {str(e)}")


if __name__ == "__main__":
    main()