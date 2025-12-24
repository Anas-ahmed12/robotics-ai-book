import os
import logging
import requests
import time
import cohere
from qdrant_client import QdrantClient
from qdrant_client.http import models
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from dotenv import load_dotenv
import argparse
import sys
from typing import List, Dict, Optional, Tuple


# Load environment variables
load_dotenv()


class BookEmbeddingsPipeline:
    """
    Backend script to extract content from the deployed robotics-AI book site,
    generate vector embeddings using Cohere's API, and store them in Qdrant vector database with metadata.
    """

    def __init__(self):
        # Setup logging
        self.setup_logging()

        # Initialize clients
        self.cohere_client = self.setup_cohere_client()
        self.qdrant_client = self.setup_qdrant_client()

        # Configuration
        self.book_site_url = os.getenv('BOOK_SITE_URL', 'https://robotics-ai-book-one.vercel.app/')
        self.book_sitemap_url = os.getenv('BOOK_SITEMAP_URL', 'https://robotics-ai-book-one.vercel.app/sitemap.xml')

    def setup_logging(self):
        """Setup logging configuration"""
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def setup_cohere_client(self):
        """Setup Cohere client initialization"""
        api_key = os.getenv('COHERE_API_KEY')
        if not api_key:
            raise ValueError("COHERE_API_KEY environment variable is required")

        self.logger.info("Initializing Cohere client...")
        return cohere.Client(api_key)

    def setup_qdrant_client(self):
        """Setup Qdrant client initialization"""
        host = os.getenv('QDRANT_HOST', 'localhost')
        port = int(os.getenv('QDRANT_PORT', '6333'))
        api_key = os.getenv('QDRANT_API_KEY')

        self.logger.info(f"Initializing Qdrant client at {host}:{port}...")

        # Check if host contains protocol (http:// or https://)
        if host.startswith(('http://', 'https://')):
            # Use url parameter instead of host/port when full URL is provided
            if api_key:
                return QdrantClient(url=host, api_key=api_key)
            else:
                return QdrantClient(url=host)
        else:
            # Use host/port when only host is provided
            if api_key:
                return QdrantClient(host=host, port=port, api_key=api_key)
            else:
                return QdrantClient(host=host, port=port)

    def get_all_urls(self) -> List[str]:
        """
        Extract URLs from book site using sitemap
        """
        self.logger.info(f"Fetching URLs from sitemap: {self.book_sitemap_url}")

        try:
            response = requests.get(self.book_sitemap_url)
            response.raise_for_status()

            # Import warnings to handle XML parsing warning
            import warnings
            from bs4 import XMLParsedAsHTMLWarning

            # Filter out the XML parsing warning
            warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

            # Use 'xml' parser which should work with lxml installed
            soup = BeautifulSoup(response.content, 'xml')

            urls = []

            # Extract URLs from sitemap - standard sitemap XML element
            url_elements = soup.find_all('loc')

            for element in url_elements:
                # Get the URL from the 'loc' element
                url_str = element.text.strip()

                # Check for both the configured base URL and the alternative domain in sitemap
                # The sitemap might contain different domain than the one we're accessing
                if (url_str.startswith(self.book_site_url) or
                    url_str.startswith('https://robotics-ai-book.github.io/')):
                    urls.append(url_str)

            self.logger.info(f"Found {len(urls)} URLs in sitemap")
            return urls

        except requests.RequestException as e:
            self.logger.error(f"Error fetching sitemap: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Error parsing sitemap: {e}")
            # If XML parsing fails completely, try a simple text-based approach
            try:
                # Simple approach: find URLs in the response using regex
                import re
                url_pattern = r'https?://[^\s"<>\']*(?:robotics-ai-book|\w+\.vercel\.app)[^\s"<>\']*'
                found_urls = re.findall(url_pattern, response.text)
                # Filter to only include URLs from the book site (both domains)
                filtered_urls = [
                    url for url in found_urls
                    if url.startswith(self.book_site_url) or url.startswith('https://robotics-ai-book.github.io/')
                ]
                self.logger.info(f"Found {len(filtered_urls)} URLs using regex fallback")
                return filtered_urls
            except:
                raise

    def extract_text_from_url(self, url: str) -> str:
        """
        Extract text content from a given URL using BeautifulSoup
        """
        self.logger.info(f"Extracting text from URL: {url}")

        try:
            response = requests.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()

            # Get text content
            text = soup.get_text()

            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)

            self.logger.info(f"Extracted {len(text)} characters from {url}")
            return text

        except requests.RequestException as e:
            self.logger.error(f"Error fetching URL {url}: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Error extracting text from {url}: {e}")
            raise

    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """
        Split text into chunks with specified size and overlap
        """
        if not text:
            return []

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            # If we're near the end, include the rest
            if end >= len(text):
                chunks.append(text[start:])
                break

            # Find a good breaking point (try to break at sentence or word boundary)
            chunk = text[start:end]

            # Look for sentence boundary within the last 100 characters
            sentence_break = chunk.rfind('. ', chunk_size - 200, chunk_size - 10)
            if sentence_break != -1:
                end = start + sentence_break + 1
            else:
                # Look for word boundary
                word_break = chunk.rfind(' ', chunk_size - 100, chunk_size - 10)
                if word_break != -1:
                    end = start + word_break

            chunks.append(text[start:end])
            start = end - overlap  # Apply overlap

            # Ensure we make progress to avoid infinite loops
            if start >= len(text):
                break
            if start == end - overlap and overlap == 0:
                # If no overlap and we didn't find a good break, just take the chunk
                chunks.append(text[start:end])
                start = end

        self.logger.info(f"Text chunked into {len(chunks)} pieces")
        return chunks

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings using Cohere's API
        """
        if not texts:
            return []

        self.logger.info(f"Generating embeddings for {len(texts)} text chunks...")

        try:
            response = self.cohere_client.embed(
                texts=texts,
                model="embed-english-v3.0",
                input_type="search_document"
            )

            embeddings = [embedding for embedding in response.embeddings]
            self.logger.info(f"Generated {len(embeddings)} embeddings")
            return embeddings

        except Exception as e:
            self.logger.error(f"Error generating embeddings: {e}")
            raise

    def create_collection(self, collection_name: str = "rag_embeddings"):
        """
        Create Qdrant collection for storing embeddings
        """
        self.logger.info(f"Creating Qdrant collection: {collection_name}")

        try:
            # Check if collection already exists
            collections = self.qdrant_client.get_collections()
            collection_names = [col.name for col in collections.collections]

            if collection_name in collection_names:
                self.logger.info(f"Collection {collection_name} already exists")
                return

            # Create collection with appropriate vector size (Cohere embeddings are 1024-dim)
            self.qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=1024, distance=models.Distance.COSINE)
            )

            self.logger.info(f"Created collection {collection_name} successfully")

        except Exception as e:
            self.logger.error(f"Error creating collection {collection_name}: {e}")
            raise

    def save_chunk_to_qdrant(self,
                           collection_name: str,
                           embedding: List[float],
                           text_chunk: str,
                           metadata: Dict[str, any],
                           point_id: Optional[str] = None):
        """
        Save a text chunk with its embedding to Qdrant with metadata
        """
        if point_id is None:
            import uuid
            point_id = str(uuid.uuid4())

        try:
            self.qdrant_client.upsert(
                collection_name=collection_name,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "text": text_chunk,
                            **metadata
                        }
                    )
                ]
            )

            self.logger.info(f"Saved chunk to Qdrant with ID: {point_id}")

        except Exception as e:
            self.logger.error(f"Error saving chunk to Qdrant: {e}")
            raise

    def validate_book_site_accessibility(self) -> bool:
        """
        Verify that the book site is accessible
        """
        # First check the configured book site URL
        try:
            response = requests.get(self.book_site_url)
            response.raise_for_status()
            self.logger.info(f"Book site {self.book_site_url} is accessible")
            return True
        except Exception as e:
            self.logger.warning(f"Book site {self.book_site_url} is not accessible: {e}")

            # Try the alternative domain that might be in the sitemap
            alternative_url = self.book_site_url.replace('robotics-ai-book-one.vercel.app', 'robotics-ai-book.github.io')
            if alternative_url != self.book_site_url:
                try:
                    response = requests.get(alternative_url)
                    response.raise_for_status()
                    # Update the book site URL to use the working domain
                    self.book_site_url = alternative_url
                    self.book_sitemap_url = self.book_sitemap_url.replace('robotics-ai-book-one.vercel.app', 'robotics-ai-book.github.io')
                    self.logger.info(f"Using alternative book site {alternative_url}")
                    return True
                except Exception as e2:
                    self.logger.error(f"Alternative book site {alternative_url} is also not accessible: {e2}")

            return False

    def execute_pipeline(self, collection_name: str = "rag_embeddings"):
        """
        Execute the complete pipeline: fetch URLs, extract text, generate embeddings, store in Qdrant
        """
        self.logger.info("Starting book embeddings pipeline...")

        # Validate book site accessibility
        if not self.validate_book_site_accessibility():
            raise Exception("Book site is not accessible. Cannot proceed with pipeline.")

        # Create collection
        self.create_collection(collection_name)

        # Get all URLs
        urls = self.get_all_urls()

        # Process each URL
        for i, url in enumerate(urls):
            # Fix URL domain if needed - replace github.io domain with vercel domain for access
            processed_url = url.replace('robotics-ai-book.github.io', 'robotics-ai-book-one.vercel.app')
            self.logger.info(f"Processing URL {i+1}/{len(urls)}: {url} (accessed as {processed_url})")

            try:
                # Extract text from URL
                text = self.extract_text_from_url(processed_url)

                if not text.strip():
                    self.logger.warning(f"No text extracted from {url}, skipping...")
                    continue

                # Chunk the text
                chunks = self.chunk_text(text)

                # Process each chunk
                for j, chunk in enumerate(chunks):
                    # Generate embedding for the chunk
                    embeddings = self.embed([chunk])

                    if embeddings:
                        # Prepare metadata
                        metadata = {
                            "source_url": processed_url,  # Use the processed URL that was actually accessed
                            "chunk_index": j,
                            "word_count": len(chunk.split()),
                            "source_title": f"URL_{i+1}_Chunk_{j+1}"
                        }

                        # Save to Qdrant
                        self.save_chunk_to_qdrant(
                            collection_name=collection_name,
                            embedding=embeddings[0],
                            text_chunk=chunk,
                            metadata=metadata
                        )

                # Add a small delay to respect rate limits
                time.sleep(0.1)

            except Exception as e:
                self.logger.error(f"Error processing URL {url}: {e}")
                continue  # Continue with next URL

        self.logger.info("Pipeline execution completed successfully!")


def main():
    parser = argparse.ArgumentParser(description='Book Embeddings Pipeline')
    parser.add_argument('--collection', default='rag_embeddings', help='Qdrant collection name')
    parser.add_argument('--log-level', default='INFO', help='Logging level')

    args = parser.parse_args()

    # Update log level if specified
    if args.log_level:
        logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))

    try:
        pipeline = BookEmbeddingsPipeline()
        pipeline.execute_pipeline(args.collection)
    except Exception as e:
        logging.error(f"Pipeline execution failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()