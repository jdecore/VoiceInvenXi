from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import engine, Base
from routers import products, movements, elevenlabs, search

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
app.include_router(search.router)


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
