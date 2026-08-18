import os
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter()

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"


def get_api_key() -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
    return api_key


@router.post("/api/stt")
async def speech_to_text(file: UploadFile = File(...)):
    api_key = get_api_key()
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{ELEVENLABS_API_URL}/speech-to-text",
            headers={"xi-api-key": api_key},
            files={
                "file": (file.filename or "audio.webm", content, file.content_type or "audio/webm"),
            },
            data={
                "model_id": "eleven_multilingual_v2",
            },
        )

        if not response.is_success:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ElevenLabs STT failed: {response.text}",
            )

        data = response.json()
        return {"text": data.get("text", "")}