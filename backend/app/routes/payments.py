import logging
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Payment, Loan, Installment, User
from app.schemas.payment import PaymentCreate, PaymentResponse


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

logger = logging.getLogger(__name__)


# =========================================================
# MONEY HELPER
# =========================================================

def money(value) -> Decimal:
    """
    Convert any numeric value to a safe money Decimal
    rounded to exactly 2 decimal places.
    """

    return Decimal(
        str(value or 0)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# =========================================================
# GET ALL PAYMENTS
# =========================================================

@router.get(
    "",
    response_model=list[PaymentResponse]
)
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return all recorded payments ordered by newest payment
    date first.
    """

    payments = (
        db.query(Payment)
        .order_by(
            Payment.payment_date.desc(),
            Payment.id.desc()
        )
        .all()
    )

    return payments


# =========================================================
# CREATE PAYMENT
# =========================================================

@router.post(
    "",
    response_model=PaymentResponse
)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Record a payment and safely update its installment.

    Business rules protected here:

    1. Loan must exist.
    2. Cancelled loans cannot receive payments.
    3. Completed loans cannot receive new payments.
    4. Payment date cannot be before loan start date.
    5. Payment date cannot be in the future.
    6. Installment must belong to the selected loan.
    7. Fully paid installments cannot receive payments.
    8. Payment cannot exceed remaining installment amount.
    9. Paid amount can never exceed installment total.
    10. Installment status becomes partial or paid.
    11. Loan becomes completed only when every installment
        is fully paid.
    12. Monetary values are rounded safely to 2 decimals.
    13. Everything is committed as one transaction.
    """

    try:

        # =====================================================
        # 1. NORMALIZE PAYMENT AMOUNT
        # =====================================================

        payment_amount = money(
            payment_data.amount
        )

        if payment_amount <= Decimal("0.00"):
            raise HTTPException(
                status_code=400,
                detail="Payment amount must be greater than zero."
            )

        # =====================================================
        # 2. CHECK LOAN
        #
        # with_for_update() prevents two simultaneous
        # payments from modifying the same loan at the
        # exact same time.
        # =====================================================

        loan = (
            db.query(Loan)
            .filter(
                Loan.id == payment_data.loan_id
            )
            .with_for_update()
            .first()
        )

        if not loan:
            raise HTTPException(
                status_code=404,
                detail="Loan not found."
            )

        # =====================================================
        # 3. PROTECT LOAN STATUS
        # =====================================================

        loan_status = (
            str(loan.status).strip().lower()
            if loan.status
            else ""
        )

        if loan_status == "cancelled":
            raise HTTPException(
                status_code=400,
                detail="Payments cannot be recorded for a cancelled loan."
            )

        if loan_status == "completed":
            raise HTTPException(
                status_code=400,
                detail="This loan is already completed."
            )

        # =====================================================
        # 4. CHECK PAYMENT DATE
        # =====================================================

        if payment_data.payment_date < loan.start_date:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Payment date cannot be before "
                    "the loan start date."
                )
            )

        # =====================================================
        # 5. CHECK PAYMENT DATE AGAINST TODAY
        #
        # PaymentCreate already validates this, but we keep
        # the backend business rule here as an extra layer.
        # =====================================================

        from datetime import date

        if payment_data.payment_date > date.today():
            raise HTTPException(
                status_code=400,
                detail="Payment date cannot be in the future."
            )

        # =====================================================
        # 6. CHECK DUPLICATE REFERENCE NUMBER
        # =====================================================

        reference_number = (
            payment_data.reference_number.strip()
            if payment_data.reference_number
            else None
        )

        if reference_number:

            existing_payment = (
                db.query(Payment)
                .filter(
                    Payment.reference_number
                    == reference_number
                )
                .first()
            )

            if existing_payment:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Reference number "
                        f"'{reference_number}' "
                        f"is already used for Payment "
                        f"#{existing_payment.id}."
                    )
                )

        # =====================================================
        # 7. INSTALLMENT IS REQUIRED
        #
        # The business flow is:
        #
        # Loan → Installment → Payment
        #
        # This prevents a payment from being recorded without
        # knowing which installment it belongs to.
        # =====================================================

        if payment_data.installment_id is None:

            raise HTTPException(
                status_code=400,
                detail=(
                    "An installment must be selected "
                    "when recording a payment."
                )
            )

        # =====================================================
        # 8. FIND AND LOCK INSTALLMENT
        # =====================================================

        installment = (
            db.query(Installment)
            .filter(
                Installment.id
                == payment_data.installment_id,

                Installment.loan_id
                == payment_data.loan_id
            )
            .with_for_update()
            .first()
        )

        if not installment:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Installment not found for this loan."
                )
            )

        # =====================================================
        # 9. NORMALIZE INSTALLMENT VALUES
        # =====================================================

        total_amount = money(
            installment.total_amount
        )

        paid_amount = money(
            installment.paid_amount
        )

        # =====================================================
        # 10. PROTECT AGAINST INVALID DATABASE DATA
        # =====================================================

        if total_amount < Decimal("0.00"):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Installment contains an invalid "
                    "negative total amount."
                )
            )

        if paid_amount < Decimal("0.00"):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Installment contains an invalid "
                    "negative paid amount."
                )
            )

        # =====================================================
        # 11. PREVENT PAID AMOUNT FROM ALREADY EXCEEDING TOTAL
        # =====================================================

        if paid_amount > total_amount:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Installment data is invalid because "
                    "the paid amount exceeds the total amount."
                )
            )

        # =====================================================
        # 12. CALCULATE REMAINING AMOUNT
        # =====================================================

        remaining_amount = (
            total_amount - paid_amount
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        if remaining_amount < Decimal("0.00"):
            remaining_amount = Decimal("0.00")

        # =====================================================
        # 13. PREVENT PAYMENT FOR FULLY PAID INSTALLMENT
        # =====================================================

        if remaining_amount == Decimal("0.00"):

            installment.status = "paid"

            raise HTTPException(
                status_code=400,
                detail=(
                    "This installment is already fully paid."
                )
            )

        # =====================================================
        # 14. PREVENT OVERPAYMENT
        # =====================================================

        if payment_amount > remaining_amount:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Payment amount cannot exceed the "
                    f"remaining installment amount of "
                    f"₹{remaining_amount:.2f}."
                )
            )

        # =====================================================
        # 15. CALCULATE NEW PAID AMOUNT
        # =====================================================

        new_paid_amount = (
            paid_amount + payment_amount
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        # Safety protection
        if new_paid_amount > total_amount:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Payment would make the installment "
                    "paid amount exceed its total amount."
                )
            )

        # =====================================================
        # 16. CALCULATE NEW REMAINING AMOUNT
        # =====================================================

        new_remaining_amount = (
            total_amount - new_paid_amount
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        if new_remaining_amount < Decimal("0.00"):
            new_remaining_amount = Decimal("0.00")

        # =====================================================
        # 17. CREATE PAYMENT RECORD
        # =====================================================

        new_payment = Payment(
            loan_id=payment_data.loan_id,

            installment_id=payment_data.installment_id,

            amount=payment_amount,

            payment_date=payment_data.payment_date,

            payment_method=payment_data.payment_method,

            reference_number=reference_number,

            notes=payment_data.notes
        )

        db.add(new_payment)

        # =====================================================
        # 18. UPDATE INSTALLMENT PAID AMOUNT
        # =====================================================

        installment.paid_amount = new_paid_amount

        # =====================================================
        # 19. UPDATE INSTALLMENT STATUS
        # =====================================================

        if new_remaining_amount == Decimal("0.00"):

            installment.status = "paid"

        else:

            installment.status = "partial"

        # =====================================================
        # 20. CHECK WHETHER ALL INSTALLMENTS ARE PAID
        # =====================================================

        all_installments = (
            db.query(Installment)
            .filter(
                Installment.loan_id
                == payment_data.loan_id
            )
            .all()
        )

        if not all_installments:

            raise HTTPException(
                status_code=400,
                detail=(
                    "This loan does not have any installments."
                )
            )

        all_installments_paid = True

        for item in all_installments:

            item_total = money(
                item.total_amount
            )

            item_paid = money(
                item.paid_amount
            )

            # Safety normalization
            if item_paid > item_total:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Loan contains an invalid installment "
                        "where paid amount exceeds total amount."
                    )
                )

            if item_paid < item_total:

                all_installments_paid = False

                break

        # =====================================================
        # 21. COMPLETE LOAN ONLY WHEN ALL INSTALLMENTS
        # ARE FULLY PAID
        # =====================================================

        if all_installments_paid:

            loan.status = "completed"

        else:

            # Do not accidentally change cancelled/completed
            # statuses here. At this point the loan is normally
            # active or pending.
            if loan_status == "active":
                loan.status = "active"

        # =====================================================
        # 22. SAVE PAYMENT + INSTALLMENT + LOAN TOGETHER
        # =====================================================

        db.commit()

        # =====================================================
        # 23. REFRESH PAYMENT
        # =====================================================

        db.refresh(new_payment)

        # =====================================================
        # 24. LOG SUCCESS
        # =====================================================

        logger.info(
            "Payment recorded successfully: "
            "payment_id=%s, loan_id=%s, installment_id=%s, "
            "amount=%s, payment_date=%s, "
            "installment_status=%s, loan_status=%s",
            new_payment.id,
            new_payment.loan_id,
            new_payment.installment_id,
            new_payment.amount,
            new_payment.payment_date,
            installment.status,
            loan.status
        )

        return new_payment

    # =====================================================
    # DATABASE INTEGRITY ERROR
    # =====================================================

    except IntegrityError as error:

        db.rollback()

        logger.error(
            "Database error while creating payment: %s",
            error
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Payment could not be recorded because "
                "the data conflicts with an existing "
                "database record."
            )
        )

    # =====================================================
    # EXPECTED BUSINESS ERROR
    # =====================================================

    except HTTPException:

        db.rollback()

        raise

    # =====================================================
    # UNEXPECTED ERROR
    # =====================================================

    except Exception as error:

        db.rollback()

        logger.exception(
            "Unexpected error while creating payment: %s",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to record payment due to "
                "a server error."
            )
        )
