# Data Model: Deploy Book Site, Generate Embeddings, Store in Qdrant

## Entities

### Book Content Chunk
- **id**: string (auto-generated UUID for Qdrant)
- **text**: string (the actual text content of the chunk)
- **source_url**: string (URL where the content was extracted from)
- **section_title**: string (title of the section/chapter)
- **chunk_index**: integer (position of this chunk within the document)
- **created_at**: datetime (timestamp when chunk was processed)
- **word_count**: integer (number of words in the chunk)

### Embedding Vector
- **vector**: list[float] (the actual embedding vector from Cohere)
- **chunk_id**: string (reference to the Book Content Chunk)
- **model**: string (name of the embedding model used)
- **dimensions**: integer (number of dimensions in the embedding)

### Qdrant Point
- **id**: string (unique identifier for the Qdrant point)
- **vector**: list[float] (embedding vector)
- **payload**: dict
  - **text**: string (the original text chunk)
  - **source_url**: string (URL of the source page)
  - **section_title**: string (title of the section)
  - **chunk_index**: integer (position in the document)
  - **word_count**: integer (number of words in the chunk)

## Relationships

- Each Book Content Chunk has exactly one Embedding Vector (1:1)
- Each Qdrant Point contains an Embedding Vector and Book Content Chunk metadata (1:1)

## Validation Rules

### Book Content Chunk
- text must not be empty
- source_url must be a valid URL format
- chunk_index must be non-negative
- word_count must be positive

### Embedding Vector
- vector must have consistent dimensions (expected by Cohere model)
- chunk_id must reference an existing Book Content Chunk

### Qdrant Point
- id must be unique within the collection
- vector must match the collection's vector size
- payload must contain all required metadata fields

## State Transitions

### Processing Pipeline
1. **URL Fetched** → Content extracted from web page
2. **Content Chunked** → Text split into semantic chunks
3. **Embedding Generated** → Vector representation created
4. **Stored in Qdrant** → Vector and metadata saved to database