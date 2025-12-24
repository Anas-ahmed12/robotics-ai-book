# Backend Processing Interface Contract

## Functions in main.py

### get_all_urls(base_url: str) -> List[str]
- **Purpose**: Extract all internal URLs from the book site
- **Input**: Base URL of the book site
- **Output**: List of all internal page URLs
- **Error conditions**: Network errors, invalid URL format

### extract_text_from_url(url: str) -> str
- **Purpose:** Extract all internal URLs from the book site using sitemap.xml (primary) with optional fallback crawling
- **Input**: URL to extract text from
- **Output**: Clean text content without HTML tags
- **Error conditions**: Network errors, parsing failures

### chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[Dict]
- **Purpose**: Split text into semantic chunks with metadata
- **Input**: Text to chunk, chunk size, overlap size
- **Output**: List of chunk dictionaries with text and metadata
- **Error conditions**: Empty text input

### embed(text_chunks: List[Dict]) -> List[Dict]
- **Purpose**: Generate embeddings for text chunks
- **Input**: List of text chunks with metadata
- **Output**: List of chunks with embedding vectors added
- **Error conditions**: Cohere API errors, rate limits

### create_collection(collection_name: str = "rag_embedding")
- **Purpose**: Create Qdrant collection for storing embeddings
- **Input**: Collection name
- **Output**: Success confirmation
- **Error conditions**: Qdrant connection errors, collection creation failures

### save_chunk_to_qdrant(chunk: Dict, collection_name: str = "rag_embedding")
- **Purpose**: Save a single chunk with embedding to Qdrant
- **Input**: Chunk data with text, metadata, and embedding
- **Output**: Point ID in Qdrant
- **Error conditions**: Qdrant storage errors

### main()
- **Purpose**: Execute the complete pipeline
- **Input**: None (uses environment variables)
- **Output**: Complete embedding pipeline execution
- **Error conditions**: Any of the above function errors