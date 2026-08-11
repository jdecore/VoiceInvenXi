from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Product
from schemas import ProductCreate, ProductResponse, ApiResponse

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

    return ApiResponse(
        success=True,
        data=ProductResponse.model_validate(product).model_dump(by_alias=True),
    )
