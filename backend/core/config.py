import os

class Settings:
    # Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "ollama")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "qwen2.5:3b")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    
    # ChromaDB
    CHROMA_HOST: str = os.getenv("CHROMA_HOST", "chromadb")
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", "8000"))
    
    # Application
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

settings = Settings()
