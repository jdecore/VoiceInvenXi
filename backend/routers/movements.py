from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Product, Movement
from schemas import MovementCreate, MovementResponse, ApiResponse

router = APIRouter(prefix="/api/movements", tags=["movements"])


@router.post("", status_code=201)
async def create_movement(data: MovementCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == data.productId))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail=ApiResponse(success=False, message="Producto no encontrado").model_dump(),
        )

    if data.type == "out" and product.stock < data.quantity:
        raise HTTPException(
            status_code=400,
            detail=ApiResponse(success=False, message="Stock insuficiente").model_dump(),
        )

    if data.type == "in":
        product.stock += data.quantity
    else:
        product.stock -= data.quantity

    movement = Movement(
        product_id=data.productId,
        quantity=data.quantity,
        type=data.type,
    )

    db.add(movement)
    await db.commit()
    await db.refresh(movement)

    return ApiResponse(
        success=True,
        data=MovementResponse.model_validate(movement).model_dump(by_alias=True),
    )
