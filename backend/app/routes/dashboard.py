from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User

from app.schemas.dashboard import DashboardResponse

from app.services.dashboard_service import (
    get_business_insights,
    get_dashboard_alerts,
    get_dashboard_summary,
    get_upcoming_payments,
    get_overdue_payments,
    get_loan_status_overview,
    get_payment_collection_summary
    
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get(
    "/summary",
    response_model=DashboardResponse
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_summary(db)


# =========================================================
# UPCOMING PAYMENTS
# =========================================================

@router.get(
    "/upcoming-payments"
)
def upcoming_payments(
    days_ahead: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_upcoming_payments(
        db,
        days_ahead
    )


# =========================================================
# OVERDUE PAYMENTS
# =========================================================

@router.get(
    "/overdue-payments"
)
def overdue_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_overdue_payments(db)


# =========================================================
# LOAN STATUS OVERVIEW
# =========================================================

@router.get(
    "/loan-status"
)
def loan_status_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_loan_status_overview(db)


# =========================================================
# PAYMENT COLLECTION SUMMARY
# =========================================================

@router.get(
    "/payment-collections"
)
def payment_collection_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_payment_collection_summary(db)
@router.get("/business-insights")
def business_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_business_insights(db)
@router.get("/alerts")
def dashboard_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_alerts(db)