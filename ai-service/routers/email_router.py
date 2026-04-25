from fastapi import APIRouter

from schemas.request_models import EmailProcessRequest
from services.email_agent import process_email


router = APIRouter(prefix="/ai", tags=["email"])


@router.post("/email-process")
async def email_process(request: EmailProcessRequest):
    return process_email(request.email_text, request.userId)
