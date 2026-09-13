from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.loan_calculation import (
    calculate_loan_outstanding,
    get_overdue_installments
)
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Loan,
    Customer,
    User,
    Installment
)
from app.schemas.loan import (
    LoanCreate,
    LoanResponse,
    LoanUpdate,
)


router = APIRouter(
    prefix="/loans",
    tags=["Loans"]
)


# =========================================================
# MONEY HELPER
# =========================================================

def money(value) -> Decimal:
    """
    Convert a numeric value into a safe money Decimal
    rounded to 2 decimal places.
    """

    return Decimal(
        str(value or 0)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# =========================================================
# LOAN STATUS CONSISTENCY
# =========================================================

def get_installment_status(
    db: Session,
    loan_id: int
) -> dict:
    """
    Check whether all installments for a loan are fully paid.

    Returns:

    {
        "has_installments": bool,
        "all_paid": bool,
        "total_installments": int,
        "unpaid_installments": int
    }
    """

    installments = (
        db.query(Installment)
        .filter(
            Installment.loan_id == loan_id
        )
        .all()
    )

    if not installments:
        return {
            "has_installments": False,
            "all_paid": False,
            "total_installments": 0,
            "unpaid_installments": 0
        }

    all_paid = True
    unpaid_installments = 0

    for installment in installments:

        total_amount = money(
            installment.total_amount
        )

        paid_amount = money(
            installment.paid_amount
        )

        # Protect against invalid installment data
        if paid_amount < Decimal("0.00"):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Installment #{installment.installment_number} "
                    "contains an invalid negative paid amount."
                )
            )

        if total_amount < Decimal("0.00"):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Installment #{installment.installment_number} "
                    "contains an invalid negative total amount."
                )
            )

        if paid_amount > total_amount:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Installment #{installment.installment_number} "
                    "has a paid amount greater than its total amount."
                )
            )

        if paid_amount < total_amount:
            all_paid = False
            unpaid_installments += 1

    return {
        "has_installments": True,
        "all_paid": all_paid,
        "total_installments": len(installments),
        "unpaid_installments": unpaid_installments
    }


# =========================================================
# CREATE LOAN
# =========================================================

@router.post(
    "",
    response_model=LoanResponse
)
def create_loan(
    loan_data: LoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new loan.
    """

    # Check whether customer exists
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == loan_data.customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    new_loan = Loan(
        customer_id=loan_data.customer_id,
        principal_amount=loan_data.principal_amount,
        interest_rate=loan_data.interest_rate,
        interest_type=loan_data.interest_type,
        tenure_months=loan_data.tenure_months,
        start_date=loan_data.start_date,
        maturity_date=loan_data.maturity_date,
        purpose=loan_data.purpose,
        status="active"
    )

    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)

    return new_loan


# =========================================================
# GET LOAN OUTSTANDING
# =========================================================

@router.get(
    "/{loan_id}/outstanding"
)
def get_loan_outstanding(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    return calculate_loan_outstanding(
        db,
        loan
    )


# =========================================================
# GET ALL LOANS
# =========================================================

@router.get(
    "",
    response_model=list[LoanResponse]
)
def get_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loans = (
        db.query(Loan)
        .order_by(
            Loan.id.desc()
        )
        .all()
    )

    return loans


# =========================================================
# GET LOANS FOR A CUSTOMER
# =========================================================

@router.get(
    "/customer/{customer_id}",
    response_model=list[LoanResponse]
)
def get_customer_loans(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    loans = (
        db.query(Loan)
        .filter(
            Loan.customer_id == customer_id
        )
        .order_by(
            Loan.id.desc()
        )
        .all()
    )

    return loans


# =========================================================
# GET OVERDUE INSTALLMENTS
# =========================================================

@router.get(
    "/{loan_id}/overdue"
)
def get_loan_overdue_installments(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    overdue_installments = get_overdue_installments(
        db,
        loan
    )

    return {
        "loan_id": loan.id,
        "overdue_count": len(
            overdue_installments
        ),
        "overdue_installments": overdue_installments
    }


# =========================================================
# GET ONE LOAN
# =========================================================

@router.get(
    "/{loan_id}",
    response_model=LoanResponse
)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    return loan


# =========================================================
# UPDATE LOAN
# =========================================================

@router.put(
    "/{loan_id}",
    response_model=LoanResponse
)
def update_loan(
    loan_id: int,
    loan_data: LoanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a loan while protecting loan/installment
    status consistency.

    Business rules:

    1. A loan cannot be marked completed while an
       installment is unpaid.

    2. A loan with all installments fully paid is
       automatically marked completed.

    3. A completed loan cannot be changed back to active
       if all installments are already paid.

    4. Cancelled loans remain cancelled unless explicitly
       changed through valid business logic.

    5. Invalid installment payment data is rejected.
    """

    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    # -----------------------------------------------------
    # Update normal loan fields
    # -----------------------------------------------------

    if loan_data.principal_amount is not None:
        loan.principal_amount = (
            loan_data.principal_amount
        )

    if loan_data.interest_rate is not None:
        loan.interest_rate = (
            loan_data.interest_rate
        )

    if loan_data.interest_type is not None:
        loan.interest_type = (
            loan_data.interest_type
        )

    if loan_data.tenure_months is not None:
        loan.tenure_months = (
            loan_data.tenure_months
        )

    if loan_data.start_date is not None:
        loan.start_date = (
            loan_data.start_date
        )

    if loan_data.maturity_date is not None:
        loan.maturity_date = (
            loan_data.maturity_date
        )

    if loan_data.purpose is not None:
        loan.purpose = (
            loan_data.purpose
        )

    # -----------------------------------------------------
    # Check installment consistency
    # -----------------------------------------------------

    installment_status = get_installment_status(
        db,
        loan.id
    )

    has_installments = (
        installment_status["has_installments"]
    )

    all_paid = (
        installment_status["all_paid"]
    )

    unpaid_installments = (
        installment_status["unpaid_installments"]
    )

    # -----------------------------------------------------
    # Requested status
    # -----------------------------------------------------

    requested_status = None

    if loan_data.status is not None:
        requested_status = (
            str(loan_data.status)
            .strip()
            .lower()
        )

    # -----------------------------------------------------
    # Prevent invalid completed status
    # -----------------------------------------------------

    if requested_status == "completed":

        if not has_installments:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Loan cannot be marked completed "
                    "because it has no installments."
                )
            )

        if not all_paid:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Loan cannot be marked completed "
                    f"because {unpaid_installments} "
                    "installment(s) are still unpaid."
                )
            )

        loan.status = "completed"

    # -----------------------------------------------------
    # Prevent active status when everything is paid
    # -----------------------------------------------------

    elif requested_status == "active":

        if has_installments and all_paid:
            loan.status = "completed"

        else:
            loan.status = "active"

    # -----------------------------------------------------
    # Cancelled status
    # -----------------------------------------------------

    elif requested_status == "cancelled":

        loan.status = "cancelled"

    # -----------------------------------------------------
    # Other statuses
    # -----------------------------------------------------

    elif requested_status is not None:

        # Keep the existing status values supported by
        # the application, while preventing a completed
        # status from becoming inconsistent.

        if (
            requested_status == "pending"
            and has_installments
            and all_paid
        ):
            loan.status = "completed"

        else:
            loan.status = requested_status

    # -----------------------------------------------------
    # No status supplied
    # -----------------------------------------------------

    else:

        # If all installments are paid, make sure the loan
        # is completed even when status was not part of the
        # update request.
        if (
            has_installments
            and all_paid
            and loan.status != "cancelled"
        ):
            loan.status = "completed"

    # -----------------------------------------------------
    # Final protection
    # -----------------------------------------------------

    final_status = (
        str(loan.status).strip().lower()
        if loan.status
        else ""
    )

    if (
        final_status == "completed"
        and has_installments
        and not all_paid
    ):
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "Loan cannot be completed while "
                "installments remain unpaid."
            )
        )

    db.commit()
    db.refresh(loan)

    return loan


# =========================================================
# GET LOAN SUMMARY
# =========================================================

@router.get(
    "/{loan_id}/summary"
)
def get_loan_summary(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    financial_summary = calculate_loan_outstanding(
        db,
        loan
    )

    overdue_installments = get_overdue_installments(
        db,
        loan
    )

    return {
        **financial_summary,
        "overdue_count": len(
            overdue_installments
        ),
        "loan_status": loan.status
    }


# =========================================================
# DELETE LOAN
# =========================================================

@router.delete(
    "/{loan_id}"
)
def delete_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = (
        db.query(Loan)
        .filter(
            Loan.id == loan_id
        )
        .first()
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan not found"
        )

    db.delete(loan)
    db.commit()

    return {
        "message": "Loan deleted successfully",
        "loan_id": loan_id
    }