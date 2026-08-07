from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Product
from embeddings import get_query_embedding, get_embedding, build_product_text

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


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        query_vector = await get_query_embedding(req.query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    vector_str = "[" + ",".join(str(v) for v in query_vector) + "]"

    sql = text(f"""
        SELECT id, barcode, name, brand, category, presentation, unit, stock,
               1 - (embedding <=> '{vector_str}'::vector) AS similarity
        FROM products
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> '{vector_str}'::vector
        LIMIT 5
    """)

    result = await db.execute(sql)
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

    return SearchResponse(results=results)


class SeedResponse(BaseModel):
    updated: int
    total: int


@router.post("/seed-embeddings", response_model=SeedResponse)
async def seed_embeddings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product))
    products = result.scalars().all()

    updated = 0
    for product in products:
        text_content = build_product_text(
            product.name, product.brand, product.category, product.presentation
        )
        try:
            embedding = await get_embedding(text_content)
            vector_str = "[" + ",".join(str(v) for v in embedding) + "]"
            await db.execute(
                text(f"UPDATE products SET embedding = '{vector_str}'::vector WHERE id = '{product.id}'"),
            )
            updated += 1
        except Exception as e:
            print(f"Error generando embedding para {product.barcode}: {e}")

    await db.commit()
    return SeedResponse(updated=updated, total=len(products))
