#!/usr/bin/env python3
"""
Test script for the Robotics AI Book Assistant
"""
import asyncio
import os
from src.agents.openrouter_agent import robotics_ai_book_assistant


def test_agent():
    print("Testing Robotics AI Book Assistant...")
    print("=" * 50)

    # Test query
    test_query = "Best Language to create a website just suggestion"
    print(f"Input: {test_query}")
    print("-" * 30)

    try:
        # Process the query
        result = robotics_ai_book_assistant.process_query(test_query)

        print(f"Response: {result['response'].encode('ascii', 'ignore').decode('ascii')}")
        print(f"Query ID: {result['query_id']}")
        print(f"Confidence Score: {result['confidence_score']}")
        print(f"Sources found: {len(result['sources'])}")

        if result['sources']:
            print("\nSources:")
            for i, source in enumerate(result['sources'], 1):
                content = source.get('content', '')[:100]
                print(f"  {i}. {content.encode('ascii', 'ignore').decode('ascii')}...")

        print("\n[SUCCESS] Test completed successfully!")

    except Exception as e:
        print(f"[ERROR] Error during test: {str(e)}")
        import traceback
        traceback.print_exc()


def test_health():
    print("\nTesting Health Check...")
    print("=" * 50)

    try:
        health_info = robotics_ai_book_assistant.health_check()
        print(f"Health Status: {health_info['status']}")
        print(f"Services: {health_info['services']}")
        print("[SUCCESS] Health check completed!")

    except Exception as e:
        print(f"[ERROR] Health check failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Check if API key is available
    if not os.getenv('OPENROUTER_API_KEY'):
        print("[WARNING] OPENROUTER_API_KEY environment variable not set.")
        print("Please set your OpenRouter API key before running the test.")
        print("For testing purposes, we'll proceed but may fail on actual API calls.\n")

    test_health()
    test_agent()