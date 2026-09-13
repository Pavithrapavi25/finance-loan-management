from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Loan, Payment, Installment


def calculate_loan_outstanding(
    db: Session,
    loan: Loan
) -> dict:
    """
    Calculate total payable, total interest,
    total paid, outstanding amount, and repayment progress.
    """

    # Get all installments for this loan
    installments = (
        db.query(Installment)
        .filter(Installment.loan_id == loan.id)
        .all()
    )

    # Calculate total payable
    total_payable = sum(
        (installment.total_amount for installment in installments),
        Decimal("0.00")
    )

    # Calculate total interest
    total_interest = sum(
        (installment.interest_amount for installment in installments),
        Decimal("0.00")
    )

    # Get all payments for this loan
    payments = (
        db.query(Payment)
        .filter(Payment.loan_id == loan.id)
        .all()
    )

    # Calculate total paid
    total_paid = sum(
        (payment.amount for payment in payments),
        Decimal("0.00")
    )

    # Calculate outstanding amount
    outstanding_amount = total_payable - total_paid

    if outstanding_amount < Decimal("0.00"):
        outstanding_amount = Decimal("0.00")

    # Calculate repayment progress
    if total_payable > Decimal("0.00"):
        repayment_progress = (
            total_paid / total_payable
        ) * Decimal("100")
    else:
        repayment_progress = Decimal("0.00")

    repayment_progress = repayment_progress.quantize(
        Decimal("0.01")
    )

    return {
        "loan_id": loan.id,
        "principal_amount": Decimal(loan.principal_amount),
        "total_interest": total_interest,
        "total_payable": total_payable,
        "total_paid": total_paid,
        "outstanding_amount": outstanding_amount,
        "repayment_progress": repayment_progress
    }


def get_overdue_installments(
    db: Session,
    loan: Loan
) -> list[Installment]:
    """
    Get installments that are overdue and not fully paid.
    """

    today = date.today()

    overdue_installments = (
        db.query(Installment)
        .filter(
            Installment.loan_id == loan.id,
            Installment.due_date < today,
            Installment.paid_amount < Installment.total_amount
        )
        .order_by(Installment.due_date)
        .all()
    )

    return overdue_installments