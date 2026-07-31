import os
import httpx

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
COHERE_API_URL = "https://api.cohere.ai/v1/embed"
MODEL = "embed-multilingual-light-v3.0"
DIMENSIONS = 384


async def get_embedding(text: str) -> list[float]:
    if not COHERE_API_KEY:
        raise ValueError("COHERE_API_KEY no configurada")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            COHERE_API_URL,
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "texts": [text],
                "model": MODEL,
                "input_type": "search_document",
                "embedding_types": ["float"],
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["embeddings"]["float"][0]


async def get_query_embedding(text: str) -> list[float]:
    if not COHERE_API_KEY:
        raise ValueError("COHERE_API_KEY no configurada")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            COHERE_API_URL,
            headers={
                "Authorization": f"Bearer {COHERE_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "texts": [text],
                "model": MODEL,
                "input_type": "search_query",
                "embedding_types": ["float"],
            },
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["embeddings"]["float"][0]


def build_product_text(name: str, brand: str | None, category: str | None, presentation: str | None) -> str:
    parts = [name]
    if brand:
        parts.append(brand)
    if category:
        parts.append(category)
    if presentation:
        parts.append(presentation)
    return " ".join(parts)
