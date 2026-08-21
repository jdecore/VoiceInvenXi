import os
import logging
import httpx

logger = logging.getLogger(__name__)

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
JINA_API_KEY = os.getenv("JINA_API_KEY")

COHERE_URL = "https://api.cohere.ai/v1/embed"
COHERE_MODEL = "embed-multilingual-v3.0"

JINA_URL = "https://api.jina.ai/v1/embeddings"
JINA_MODEL = "jina-embeddings-v5-text-small"

TIMEOUT = 30.0
BATCH_SIZE = 96

# Lock a single provider at startup. Mixing providers would write incompatible
# vectors into the same `embedding vector(1024)` column, destroying cosine
# similarity. Cohere is preferred; fall back to Jina only if Cohere is unset.
if COHERE_API_KEY:
    EMBEDDING_PROVIDER = "cohere"
elif JINA_API_KEY:
    EMBEDDING_PROVIDER = "jina"
else:
    EMBEDDING_PROVIDER = None

logger.info(f"Embedding provider locked to: {EMBEDDING_PROVIDER or 'NONE (not configured)'}")


async def _cohere_embedding(texts: list[str], input_type: str) -> list[list[float]]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            COHERE_URL,
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "texts": texts,
                "model": COHERE_MODEL,
                "input_type": input_type,
                "embedding_types": ["float"],
            },
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        return [emb for emb in data["embeddings"]["float"]]


async def _jina_embedding(texts: list[str], task: str) -> list[list[float]]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            JINA_URL,
            headers={
                "Authorization": f"Bearer {JINA_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": JINA_MODEL,
                "task": task,
                "input": texts,
                "normalized": True,
            },
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        return [item["embedding"] for item in data["data"]]


async def _embed(texts: list[str], cohere_input_type: str, jina_task: str) -> list[list[float]]:
    """Embed using the single locked provider. No runtime fallback."""
    if EMBEDDING_PROVIDER is None:
        raise ValueError("Neither COHERE_API_KEY nor JINA_API_KEY configured")
    if EMBEDDING_PROVIDER == "cohere":
        return await _cohere_embedding(texts, cohere_input_type)
    return await _jina_embedding(texts, jina_task)


async def get_embedding(text: str) -> list[float]:
    result = await _embed([text], "search_document", "retrieval.document")
    return result[0]


async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        batch_embeddings = await _embed(batch, "search_document", "retrieval.document")
        all_embeddings.extend(batch_embeddings)
    return all_embeddings


async def get_query_embedding(text: str) -> list[float]:
    result = await _embed([text], "search_query", "retrieval.query")
    return result[0]


def build_product_text(name: str, brand: str | None, category: str | None, presentation: str | None) -> str:
    parts = [name]
    if brand:
        parts.append(brand)
    if category:
        parts.append(category)
    if presentation:
        parts.append(presentation)
    return " ".join(parts)
