from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

logger = logging.getLogger(__name__)
from database import get_db
from models import Product
from schemas import ProductCreate, ProductResponse, ApiResponse
from embeddings import get_embedding, build_product_text

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
async def list_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).order_by(Product.name))
    products = result.scalars().all()
    return ApiResponse(
        success=True,
        data=[ProductResponse.model_validate(p).model_dump(by_alias=True) for p in products],
    )


@router.get("/{barcode}")
async def get_product_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.barcode == barcode))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail=ApiResponse(success=False, message="Producto no encontrado").model_dump(),
        )

    return ApiResponse(
        success=True,
        data=ProductResponse.model_validate(product).model_dump(by_alias=True),
    )


@router.post("", status_code=201)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Product).where(Product.barcode == data.barcode))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=ApiResponse(success=False, message="Ya existe un producto con ese código de barras").model_dump(),
        )

    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # Auto-generate embedding so the new product is immediately searchable.
    # Failures here must NOT break product creation.
    try:
        text = build_product_text(
            product.name, product.brand, product.category, product.presentation
        )
        embedding = await get_embedding(text)
        product.embedding = embedding
        await db.commit()
    except Exception as e:
        logger.warning(f"Auto-embedding skipped for new product {product.barcode}: {e}")

    return ApiResponse(
        success=True,
        data=ProductResponse.model_validate(product).model_dump(by_alias=True),
    )
