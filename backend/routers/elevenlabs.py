import os
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
DEFAULT_VOICE_ID = "LnGOA2SxH2fX1e1iNzEp"


class TTSRequest(BaseModel):
    text: str
    voice_id: str = DEFAULT_VOICE_ID


def get_api_key() -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
    return api_key


@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    api_key = get_api_key()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{ELEVENLABS_API_URL}/text-to-speech/{request.voice_id}",
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": request.text,
                "model_id": "eleven_multilingual_v2",
                "output_format": "mp3_44100_128",
            },
        )

        if not response.is_success:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ElevenLabs TTS failed: {response.text}",
            )

        return StreamingResponse(
            response.iter_bytes(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="speech.mp3"',
                "Content-Length": str(len(response.content)),
            },
        )


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
