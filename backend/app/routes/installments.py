from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Installment, Loan, User
from app.schemas.installment import InstallmentResponse


router = APIRouter(
    prefix="/installments",
    tags=["Installments"]
)


# Get installments for a loan
@router.get(
    "/loan/{loan_id}",
    response_model=list[InstallmentResponse]
)
def get_loan_installments(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = db.query(Loan).filter(
        Loan.id == loan_id
    ).first()

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    installments = db.query(Installment).filter(
        Installment.loan_id == loan_id
    ).order_by(
        Installment.installment_number
    ).all()

    return installments