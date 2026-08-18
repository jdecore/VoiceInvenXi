import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from schemas import ApiResponse
from needle_agent import parse_movement, parse_product

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


@router.post("/parse-movement")
async def parse_movement_endpoint(req: ParseRequest):
    try:
        result = parse_movement(req.text)
    except Exception as e:
        logger.exception(f"parse-movement failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=ApiResponse(success=False, message="Asistente no disponible").model_dump(),
        )

    if result is None:
        raise HTTPException(
            status_code=422,
            detail=ApiResponse(
                success=False,
                message="No se entendió la instrucción. Probá de nuevo o ingresá la cantidad manualmente.",
            ).model_dump(),
        )

    return ApiResponse(success=True, data=result)


@router.post("/parse-product")
async def parse_product_endpoint(req: ParseRequest):
    try:
        result = parse_product(req.text)
    except Exception as e:
        logger.exception(f"parse-product failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=ApiResponse(success=False, message="Asistente no disponible").model_dump(),
        )

    if result is None:
        raise HTTPException(
            status_code=422,
            detail=ApiResponse(
                success=False,
                message="No se pudo extraer la descripción del producto.",
            ).model_dump(),
        )

    return ApiResponse(success=True, data=result)