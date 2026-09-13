import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.database import Base, engine
from app.core.security import get_current_user
from app.models import (
    User,
    Customer,
    Loan,
    Installment,
    Payment,
    Reminder,
)
from app.routes.auth import router as auth_router
from app.routes.customers import router as customers_router
from app.routes.loans import router as loans_router
from app.routes.payments import router as payments_router
from app.routes.installments import router as installments_router
from app.routes.reminders import router as reminders_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router
from app.core.config import settings


logger = logging.getLogger(__name__)


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="Finance Loan Management API",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(loans_router)
app.include_router(payments_router)
app.include_router(installments_router)
app.include_router(reminders_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Finance Loan Management API is running"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception:
        logger.exception("Database health check failed")

        return {
            "status": "unhealthy",
            "database": "connection failed"
        }


# Current logged-in user
@app.get("/auth/me")
def get_my_profile(
    current_user=Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }