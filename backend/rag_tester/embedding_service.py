from typing import List
import numpy as np
from openai import OpenAI
from .config import Config


class EmbeddingService:
    """Service for generating embeddings using the same model as Spec-1."""

    def __init__(self):
        """Initialize the embedding service with configuration."""
        self.config = Config()

        # Initialize OpenAI client
        if self.config.OPENAI_API_KEY:
            self.client = OpenAI(api_key=self.config.OPENAI_API_KEY)
        else:
            raise ValueError("OPENAI_API_KEY is required for embedding service")

        self.model_name = self.config.EMBEDDING_MODEL_NAME

    def create_embedding(self, text: str) -> List[float]:
        """
        Create an embedding for the given text using the configured model.

        Args:
            text: The input text to convert to an embedding

        Returns:
            A list of floats representing the embedding vector
        """
        if len(text) > self.config.MAX_QUERY_LENGTH:
            text = text[:self.config.MAX_QUERY_LENGTH]

        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.model_name
            )

            embedding = response.data[0].embedding
            return embedding
        except Exception as e:
            print(f"Failed to create embedding: {str(e)}")
            raise

    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for a batch of texts.

        Args:
            texts: List of input texts to convert to embeddings

        Returns:
            A list of embedding vectors (each vector is a list of floats)
        """
        embeddings = []
        for text in texts:
            embedding = self.create_embedding(text)
            embeddings.append(embedding)

        return embeddings

    def cosine_similarity(self, vector1: List[float], vector2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.

        Args:
            vector1: First embedding vector
            vector2: Second embedding vector

        Returns:
            Cosine similarity score between 0 and 1
        """
        v1 = np.array(vector1)
        v2 = np.array(vector2)

        # Calculate cosine similarity
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)

        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0

        similarity = dot_product / (norm_v1 * norm_v2)
        return float(similarity)

    def validate_embedding_dimensions(self, embedding: List[float], expected_dims: int = None) -> bool:
        """
        Validate that the embedding has the expected dimensions.

        Args:
            embedding: The embedding vector to validate
            expected_dims: Expected number of dimensions (if None, uses model default)

        Returns:
            True if dimensions match, False otherwise
        """
        if expected_dims is None:
            # For OpenAI's text-embedding-ada-002, the dimension is 1536
            expected_dims = 1536

        return len(embedding) == expected_dims