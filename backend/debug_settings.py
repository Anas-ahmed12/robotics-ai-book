import os
from pprint import pprint
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Print environment variables
print("Environment Variables:")
pprint(dict(os.environ))

print("\nLooking for specific variables:")
print(f"OPENROUTER_API_KEY: {os.getenv('OPENROUTER_API_KEY', 'NOT FOUND')}")
print(f"QDRANT_HOST: {os.getenv('QDRANT_HOST', 'NOT FOUND')}")
print(f"QDRANT_PORT: {os.getenv('QDRANT_PORT', 'NOT FOUND')}")
print(f"QDRANT_COLLECTION_NAME: {os.getenv('QDRANT_COLLECTION_NAME', 'NOT FOUND')}")