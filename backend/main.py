from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
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
    from database import engine
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                __import__('sqlalchemy').text("SELECT 1")
            )
            return {"db": "ok", "result": result.scalar()}
    except Exception as e:
        return {"db": "error", "type": type(e).__name__, "message": str(e), "traceback": traceback.format_exc()}
