import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.chat_router import router as chat_router
from routers.document_router import router as document_router
from routers.email_router import router as email_router
from routers.recommend_router import router as recommend_router
from services.chatbot import initialize_chatbot
from services.email_agent import classifier, nlp as email_nlp
from services.document_processor import nlp as document_nlp
from services.recommender import mutual_fund_catalog

load_dotenv()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Banking AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    _ = classifier
    _ = email_nlp
    _ = document_nlp
    _ = mutual_fund_catalog
    initialize_chatbot()


app.include_router(email_router)
app.include_router(chat_router)
app.include_router(document_router)
app.include_router(recommend_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
