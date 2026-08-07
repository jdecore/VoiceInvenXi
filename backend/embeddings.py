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

TIMEOUT = 15.0


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


async def _embed_with_fallback(texts: list[str], cohere_input_type: str, jina_task: str) -> list[list[float]]:
    if COHERE_API_KEY:
        try:
            return await _cohere_embedding(texts, cohere_input_type)
        except (httpx.HTTPStatusError, Exception) as e:
            logger.warning(f"Cohere fallback to Jina: {e}")
    if JINA_API_KEY:
        return await _jina_embedding(texts, jina_task)
    raise ValueError("Neither COHERE_API_KEY nor JINA_API_KEY configured")


async def get_embedding(text: str) -> list[float]:
    result = await _embed_with_fallback([text], "search_document", "retrieval.document")
    return result[0]


async def get_query_embedding(text: str) -> list[float]:
    result = await _embed_with_fallback([text], "search_query", "retrieval.query")
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
