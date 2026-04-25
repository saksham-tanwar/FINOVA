from fastapi import APIRouter

from schemas.request_models import ChatRequest
from services.chatbot import get_chat_response


router = APIRouter(prefix="/ai", tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest):
    return get_chat_response(request.message)
