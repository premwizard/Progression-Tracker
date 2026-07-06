from fastapi import APIRouter
from typing import Dict

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, str]:
    return {"status": "ok", "message": "Progression Tracker API is healthy"}
