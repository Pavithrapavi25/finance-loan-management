from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Customer, Loan, Reminder, User
from app.schemas.reminder import (
    ReminderCreate,
    ReminderResponse,
    ReminderStatusUpdate
)
from app.services.reminder_service import (
    create_upcoming_installment_reminders
)


router = APIRouter(
    prefix="/reminders",
    tags=["Reminders"]
)


# ---------------------------------------------------------
# CREATE REMINDER
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ReminderResponse
)
def create_reminder(
    reminder_data: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check customer
    customer = db.query(Customer).filter(
        Customer.id == reminder_data.customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    # Check loan if provided
    if reminder_data.loan_id is not None:
        loan = db.query(Loan).filter(
            Loan.id == reminder_data.loan_id,
            Loan.customer_id == reminder_data.customer_id
        ).first()

        if not loan:
            raise HTTPException(
                status_code=404,
                detail="Loan not found for this customer"
            )

    # Create reminder
    new_reminder = Reminder(
        customer_id=reminder_data.customer_id,
        loan_id=reminder_data.loan_id,
        reminder_type=reminder_data.reminder_type,
        message=reminder_data.message,
        reminder_date=reminder_data.reminder_date,
        is_sent=False
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder


# ---------------------------------------------------------
# GET ALL REMINDERS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=list[ReminderResponse]
)
def get_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminders = db.query(Reminder).order_by(
        Reminder.reminder_date
    ).all()

    return reminders


# ---------------------------------------------------------
# GET CUSTOMER REMINDERS
# ---------------------------------------------------------

@router.get(
    "/customer/{customer_id}",
    response_model=list[ReminderResponse]
)
def get_customer_reminders(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check customer
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    reminders = db.query(Reminder).filter(
        Reminder.customer_id == customer_id
    ).order_by(
        Reminder.reminder_date
    ).all()

    return reminders


# ---------------------------------------------------------
# GET LOAN REMINDERS
# ---------------------------------------------------------

@router.get(
    "/loan/{loan_id}",
    response_model=list[ReminderResponse]
)
def get_loan_reminders(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check loan
    loan = db.query(Loan).filter(
        Loan.id == loan_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    reminders = db.query(Reminder).filter(
        Reminder.loan_id == loan_id
    ).order_by(
        Reminder.reminder_date
    ).all()

    return reminders


# ---------------------------------------------------------
# GENERATE UPCOMING INSTALLMENT REMINDERS
# ---------------------------------------------------------

@router.post(
    "/generate-upcoming",
    response_model=list[ReminderResponse]
)
def generate_upcoming_reminders(
    days_ahead: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminders = create_upcoming_installment_reminders(
        db,
        days_ahead
    )

    return reminders


# ---------------------------------------------------------
# GET SINGLE REMINDER
# ---------------------------------------------------------

@router.get(
    "/{reminder_id}",
    response_model=ReminderResponse
)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )

    return reminder


# ---------------------------------------------------------
# UPDATE REMINDER STATUS
# ---------------------------------------------------------

@router.patch(
    "/{reminder_id}/status",
    response_model=ReminderResponse
)
def update_reminder_status(
    reminder_id: int,
    status_data: ReminderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found"
        )

    reminder.is_sent = status_data.is_sent

    db.commit()
    db.refresh(reminder)

    return reminder

