from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    database_url: str = "postgresql://semdoc:semdoc@localhost:5433/semdoc"
    chroma_host: str = "localhost"
    chroma_port: int = 8001
    upload_dir: str = "./uploads"
    embed_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k: int = 5

    model_config = {"env_file": ".env"}


settings = Settings()
