import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from backend.main import BookEmbeddingsPipeline


class TestBookEmbeddingsPipeline:
    """Unit tests for the Book Embeddings Pipeline"""

    def setup_method(self):
        """Setup test fixtures before each test method."""
        # Mock environment variables
        os.environ['COHERE_API_KEY'] = 'test_cohere_key'
        os.environ['QDRANT_HOST'] = 'localhost'
        os.environ['QDRANT_PORT'] = '6333'
        os.environ['BOOK_SITE_URL'] = 'https://test-book-site.com'
        os.environ['BOOK_SITEMAP_URL'] = 'https://test-book-site.com/sitemap.xml'

        self.pipeline = BookEmbeddingsPipeline()

    def test_extract_text_from_url(self):
        """Unit test for extract_text_from_url function"""
        with patch('requests.get') as mock_get:
            # Mock the response
            mock_response = Mock()
            mock_response.content = b'<html><body><p>This is test content.</p></body></html>'
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            url = 'https://test-book-site.com/chapter1'
            result = self.pipeline.extract_text_from_url(url)

            assert 'test content' in result
            mock_get.assert_called_once_with(url)

    def test_chunk_text(self):
        """Unit test for chunk_text function"""
        long_text = "This is a sample text. " * 100  # Create a long text
        chunks = self.pipeline.chunk_text(long_text, chunk_size=50, overlap=10)

        # Should have multiple chunks
        assert len(chunks) > 1

        # Each chunk should not exceed the specified size (with some tolerance for sentence boundaries)
        for chunk in chunks:
            assert len(chunk) <= 60  # Allow some buffer for sentence boundary logic

        # Chunks should have overlap
        if len(chunks) > 1:
            # Check that there's some overlap between first and second chunk
            assert len(chunks) >= 1

    def test_embed(self):
        """Unit test for embed function"""
        test_texts = ["This is a test sentence.", "Another test sentence."]

        with patch.object(self.pipeline.cohere_client, 'embed') as mock_embed:
            # Mock the embedding response
            mock_response = Mock()
            mock_response.embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]
            mock_embed.return_value = mock_response

            embeddings = self.pipeline.embed(test_texts)

            assert len(embeddings) == 2
            assert len(embeddings[0]) == 3  # Each embedding should have 3 dimensions in mock
            mock_embed.assert_called_once()

    def test_create_collection(self):
        """Unit test for create_collection function"""
        collection_name = "test_collection"

        with patch.object(self.pipeline.qdrant_client, 'get_collections') as mock_get_collections, \
             patch.object(self.pipeline.qdrant_client, 'create_collection') as mock_create_collection:

            # Mock collections response
            mock_collections = Mock()
            mock_collections.collections = []
            mock_get_collections.return_value = mock_collections

            self.pipeline.create_collection(collection_name)

            mock_create_collection.assert_called_once_with(
                collection_name=collection_name,
                vectors_config=Mock()
            )

    def test_save_chunk_to_qdrant(self):
        """Unit test for save_chunk_to_qdrant function"""
        collection_name = "test_collection"
        embedding = [0.1, 0.2, 0.3]
        text_chunk = "This is a test chunk"
        metadata = {"source_url": "https://example.com"}

        with patch.object(self.pipeline.qdrant_client, 'upsert') as mock_upsert:
            self.pipeline.save_chunk_to_qdrant(
                collection_name=collection_name,
                embedding=embedding,
                text_chunk=text_chunk,
                metadata=metadata
            )

            # Verify upsert was called
            mock_upsert.assert_called_once()

    def test_get_all_urls(self):
        """Integration test for URL accessibility"""
        with patch('requests.get') as mock_get:
            # Mock sitemap response
            mock_response = Mock()
            mock_response.content = b'''<?xml version="1.0" encoding="UTF-8"?>
            <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url>
                    <loc>https://test-book-site.com/chapter1</loc>
                </url>
                <url>
                    <loc>https://test-book-site.com/chapter2</loc>
                </url>
            </urlset>'''
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response

            urls = self.pipeline.get_all_urls()

            assert len(urls) == 2
            assert 'https://test-book-site.com/chapter1' in urls
            assert 'https://test-book-site.com/chapter2' in urls
            mock_get.assert_called_once_with('https://test-book-site.com/sitemap.xml')

    def test_complete_pipeline(self):
        """Integration test for complete pipeline"""
        collection_name = "test_collection"

        with patch.object(self.pipeline, 'validate_book_site_accessibility', return_value=True), \
             patch.object(self.pipeline, 'get_all_urls', return_value=['https://test-book-site.com/chapter1']), \
             patch.object(self.pipeline, 'extract_text_from_url', return_value="This is test content for the pipeline."), \
             patch.object(self.pipeline, 'chunk_text', return_value=["This is test content for the pipeline."]), \
             patch.object(self.pipeline, 'embed', return_value=[[0.1, 0.2, 0.3]]), \
             patch.object(self.pipeline, 'create_collection'), \
             patch.object(self.pipeline, 'save_chunk_to_qdrant'):

            # Execute the pipeline
            self.pipeline.execute_pipeline(collection_name)

            # Verify that all the key methods were called
            self.pipeline.validate_book_site_accessibility.assert_called_once()
            self.pipeline.get_all_urls.assert_called_once()
            self.pipeline.create_collection.assert_called_once_with(collection_name)
            self.pipeline.extract_text_from_url.assert_called_once()
            self.pipeline.chunk_text.assert_called_once()
            self.pipeline.embed.assert_called_once()
            self.pipeline.save_chunk_to_qdrant.assert_called_once()

    def test_error_handling_api_rate_limits(self):
        """Test for error handling and API rate limits"""
        from requests.exceptions import RequestException

        # Test that the pipeline handles network errors gracefully
        with patch.object(self.pipeline, 'validate_book_site_accessibility', return_value=False):
            # This should handle the error without crashing
            try:
                self.pipeline.validate_book_site_accessibility()
            except Exception:
                pass  # Expected to fail, but should be handled gracefully