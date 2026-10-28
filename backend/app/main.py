from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
    ],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "application": "Jeevith Gardens",
    }