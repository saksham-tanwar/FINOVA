from pydantic import BaseModel, Field


class EmailProcessRequest(BaseModel):
    email_text: str
    userId: str


class ChatRequest(BaseModel):
    message: str
    userId: str


class RecommendRequest(BaseModel):
    userId: str
    riskProfile: str = Field(pattern="^(low|medium|high)$")
    amount: float
