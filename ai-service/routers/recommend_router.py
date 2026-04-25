from fastapi import APIRouter

from schemas.request_models import RecommendRequest
from services.recommender import generate_recommendations


router = APIRouter(prefix="/ai", tags=["recommend"])


@router.post("/recommend")
async def recommend(request: RecommendRequest):
    return generate_recommendations(request.userId, request.riskProfile, request.amount)
