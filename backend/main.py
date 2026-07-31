from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base, async_session
from routers import products, movements, elevenlabs

app = FastAPI(title="VoiceInvenXi API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(movements.router)
app.include_router(elevenlabs.router)


@app.on_event("startup")
async def startup():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Warning: create_all failed (tables may already exist): {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug")
async def debug():
    import traceback
    import sqlalchemy
    from database import engine
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                sqlalchemy.text("SELECT 1")
            )
            # Check if products table exists
            tables = await conn.execute(
                sqlalchemy.text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )
            table_list = [r[0] for r in tables]
            return {"db": "ok", "tables": table_list}
    except Exception as e:
        return {"db": "error", "type": type(e).__name__, "message": str(e), "traceback": traceback.format_exc()}


@app.get("/api/debug/{barcode}")
async def debug_product(barcode: str):
    import traceback
    from sqlalchemy import select
    from database import async_session
    from models import Product
    results = {}
    try:
        async with engine.connect() as conn:
            import sqlalchemy
            r = await conn.execute(
                sqlalchemy.text("SELECT * FROM products WHERE barcode = :barcode"),
                {"barcode": barcode}
            )
            row = r.mappings().first()
            results["raw_sql"] = dict(row) if row else None
    except Exception as e:
        results["raw_sql"] = {"error": str(e)}
    try:
        async with async_session() as session:
            result = await session.execute(select(Product).where(Product.barcode == barcode))
            product = result.scalar_one_or_none()
            results["orm"] = {"found": product is not None, "product": str(product) if product else None}
    except Exception as e:
        results["orm"] = {"error": str(e), "type": type(e).__name__, "traceback": traceback.format_exc()}
    return results
