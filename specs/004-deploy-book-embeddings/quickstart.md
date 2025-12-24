# Quickstart: Deploy Book Site, Generate Embeddings, Store in Qdrant

## Prerequisites

- Python 3.11+
- UV package manager installed
- Cohere API key
- Qdrant instance (local or cloud)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Create backend directory**
   ```bash
   mkdir backend
   cd backend
   ```

3. **Create virtual environment and install dependencies**
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install cohere qdrant-client beautifulsoup4 requests python-dotenv pytest
   ```

4. **Create environment file**
   ```bash
   touch .env
   ```

5. **Add required environment variables to `.env`**
   ```env
   COHERE_API_KEY=your_cohere_api_key_here
   QDRANT_URL=your_qdrant_url_here  # e.g., http://localhost:6333 or cloud URL
   QDRANT_API_KEY=your_qdrant_api_key_if_needed
   BOOK_SITE_URL=https://robotics-ai-book-one.vercel.app/
   ```

## Usage

1. **Run the embedding pipeline**
   ```bash
   python main.py
   ```

2. **The script will:**
   - Fetch all URLs from the book site
   - Extract text content from each page
   - Chunk the text into semantic segments
   - Generate embeddings using Cohere
   - Create a "rag_embedding" collection in Qdrant
   - Store all embeddings with metadata

## Testing

1. **Run tests**
   ```bash
   pytest tests/
   ```

2. **Verify Qdrant collection exists**
   - Check Qdrant dashboard or API to confirm "rag_embedding" collection was created
   - Verify points contain proper metadata (source_url, text, etc.)

## Configuration

- **Chunk size**: Modify in main.py (default: 1000 characters)
- **Overlap**: Modify in main.py (default: 100 characters)
- **Model**: Modify in main.py (default: embed-english-v3.0)

## Troubleshooting

- **API rate limits**: The script includes exponential backoff for Cohere API calls
- **Qdrant connection**: Ensure Qdrant service is running and credentials are correct
- **Web scraping**: If pages are JavaScript-heavy, consider using Selenium instead of requests