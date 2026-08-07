import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Product
from embeddings import get_query_embedding, get_embeddings_batch, build_product_text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    id: str
    barcode: str
    name: str
    brand: str | None
    category: str | None
    presentation: str | None
    unit: str | None
    stock: int
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


@router.post("/semantic")
async def semantic_search(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        query_vector = await get_query_embedding(req.query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

    sql = text("""
        SELECT id, barcode, name, brand, category, presentation, unit, stock,
               1 - (embedding <=> :vector::vector) AS similarity
        FROM products
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> :vector::vector
        LIMIT 5
    """)

    result = await db.execute(sql, {"vector": vector_str})
    rows = result.fetchall()

    results = []
    for row in rows:
        if row.similarity >= 0.4:
            results.append(SearchResult(
                id=str(row.id),
                barcode=row.barcode,
                name=row.name,
                brand=row.brand,
                category=row.category,
                presentation=row.presentation,
                unit=row.unit,
                stock=row.stock,
                score=round(float(row.similarity), 4),
            ))

    return {"success": True, "data": SearchResponse(results=results).model_dump()}


class SeedResponse(BaseModel):
    updated: int
    total: int


@router.post("/seed-embeddings", response_model=SeedResponse)
async def seed_embeddings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    products = result.scalars().all()

    if not products:
        return SeedResponse(updated=0, total=0)

    texts = []
    product_ids = []
    for product in products:
        if product.embedding is not None:
            continue
        text_content = build_product_text(
            product.name, product.brand, product.category, product.presentation
        )
        texts.append(text_content)
        product_ids.append(str(product.id))

    if not texts:
        return SeedResponse(updated=0, total=len(products))

    try:
        embeddings = await get_embeddings_batch(texts)
    except Exception as e:
        logger.error(f"Batch embedding failed: {e}")
        return SeedResponse(updated=0, total=len(products))

    updated = 0
    for product_id, embedding in zip(product_ids, embeddings):
        try:
            vector_str = "[" + ",".join(str(v) for v in embedding) + "]"
            await db.execute(
                text("UPDATE products SET embedding = :vector::vector WHERE id = :id::uuid"),
                {"vector": vector_str, "id": product_id},
            )
            updated += 1
        except Exception as e:
            logger.error(f"Error updating embedding for product {product_id}: {e}")

    await db.commit()
    return SeedResponse(updated=updated, total=len(products))
