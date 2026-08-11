from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class ProductCreate(BaseModel):
    barcode: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    brand: str | None = None
    category: str | None = None
    presentation: str | None = None
    unit: str | None = None


class ProductResponse(BaseModel):
    id: str
    barcode: str
    name: str
    brand: str | None
    category: str | None
    presentation: str | None
    unit: str | None
    stock: int
    imageUrl: str | None = Field(None, alias="image_url", serialization_alias="imageUrl")

    model_config = {"from_attributes": True, "populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def convert_uuids(cls, data):
        if hasattr(data, "__dict__"):
            data = {k: str(v) if isinstance(v, UUID) else v for k, v in data.__dict__.items() if not k.startswith("_")}
        return data


class MovementCreate(BaseModel):
    productId: str = Field(..., alias="product_id")
    quantity: int = Field(..., gt=0)
    type: str = Field(..., pattern=r"^(in|out)$")

    model_config = {"populate_by_name": True}


class MovementResponse(BaseModel):
    id: str
    productId: str = Field(..., alias="product_id")
    quantity: int
    type: str
    createdAt: datetime = Field(..., alias="created_at")

    model_config = {"from_attributes": True, "populate_by_name": True}

    @model_validator(mode="before")
    @classmethod
    def convert_uuids(cls, data):
        if hasattr(data, "__dict__"):
            data = {k: str(v) if isinstance(v, UUID) else v for k, v in data.__dict__.items() if not k.startswith("_")}
        return data


class MovementWithProductResponse(MovementResponse):
    productName: str | None = None


class ApiResponse(BaseModel):
    success: bool
    data: dict | list | None = None
    message: str | None = None
