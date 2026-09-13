
from decimal import Decimal, ROUND_HALF_UP

from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

from app.models import Loan, Installment
from app.services.emi import calculate_emi


# =========================================================
# MONEY HELPERS
# =========================================================

MONEY_ZERO = Decimal("0.00")


def to_money(value) -> Decimal:
    """
    Convert a value safely to Decimal with two decimal places.
    """

    if value is None:
        return MONEY_ZERO

    return Decimal(
        str(value)
    ).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# =========================================================
# INSTALLMENT SCHEDULE
# =========================================================

def generate_installment_schedule(
    db: Session,
    loan: Loan
):
    """
    Generate a monthly installment schedule for a loan.

    Step 7.10 Part 3 protections:

    - Safe Decimal calculations
    - Correct partial-payment starting value
    - Correct final installment rounding
    - No negative principal balance
    - No negative installment amounts
    - Zero-interest loan support
    - Exact two-decimal monetary values
    """

    # -----------------------------------------------------
    # REMOVE EXISTING INSTALLMENTS
    # -----------------------------------------------------

    db.query(
        Installment
    ).filter(
        Installment.loan_id == loan.id
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------------------
    # LOAN VALUES
    # -----------------------------------------------------

    principal = to_money(
        loan.principal_amount
    )

    annual_rate = Decimal(
        str(loan.interest_rate)
    )

    tenure = int(
        loan.tenure_months
    )

    # -----------------------------------------------------
    # BASIC VALIDATION
    # -----------------------------------------------------

    if principal <= MONEY_ZERO:
        raise ValueError(
            "Loan principal amount must be greater than zero."
        )

    if tenure <= 0:
        raise ValueError(
            "Loan tenure must be greater than zero."
        )

    if annual_rate < Decimal("0.00"):
        raise ValueError(
            "Interest rate cannot be negative."
        )

    # -----------------------------------------------------
    # EMI
    # -----------------------------------------------------

    emi = calculate_emi(
        principal,
        annual_rate,
        tenure
    )

    emi = to_money(
        emi
    )

    # -----------------------------------------------------
    # MONTHLY INTEREST RATE
    # -----------------------------------------------------

    monthly_rate = (
        annual_rate /
        Decimal("100")
    ) / Decimal("12")

    monthly_rate = Decimal(
        str(monthly_rate)
    )

    # -----------------------------------------------------
    # REMAINING PRINCIPAL
    # -----------------------------------------------------

    remaining_principal = principal

    installments = []

    # -----------------------------------------------------
    # GENERATE MONTHLY INSTALLMENTS
    # -----------------------------------------------------

    for month in range(1, tenure + 1):

        # -------------------------------------------------
        # STOP ANY ROUNDING DRIFT
        # -------------------------------------------------

        remaining_principal = to_money(
            remaining_principal
        )

        if remaining_principal < MONEY_ZERO:
            remaining_principal = MONEY_ZERO

        # -------------------------------------------------
        # INTEREST
        # -------------------------------------------------

        if monthly_rate == Decimal("0"):

            interest = MONEY_ZERO

        else:

            interest = (
                remaining_principal *
                monthly_rate
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

        if interest < MONEY_ZERO:
            interest = MONEY_ZERO

        # -------------------------------------------------
        # PRINCIPAL COMPONENT
        # -------------------------------------------------

        if month == tenure:

            # Final installment clears the exact
            # remaining principal.
            principal_component = (
                remaining_principal
            )

            total_amount = (
                principal_component +
                interest
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

        else:

            principal_component = (
                emi -
                interest
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

            # Never allow a negative principal component.
            if principal_component < MONEY_ZERO:
                principal_component = MONEY_ZERO

            # Never allow principal component to exceed
            # the remaining principal.
            if principal_component > remaining_principal:
                principal_component = (
                    remaining_principal
                )

            total_amount = (
                principal_component +
                interest
            ).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )

        # -------------------------------------------------
        # REMAINING PRINCIPAL
        # -------------------------------------------------

        remaining_principal = (
            remaining_principal -
            principal_component
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

        if remaining_principal < MONEY_ZERO:
            remaining_principal = MONEY_ZERO

        # -------------------------------------------------
        # DUE DATE
        # -------------------------------------------------

        due_date = (
            loan.start_date +
            relativedelta(
                months=month
            )
        )

        # -------------------------------------------------
        # CREATE INSTALLMENT
        # -------------------------------------------------

        installment = Installment(
            loan_id=loan.id,
            installment_number=month,
            due_date=due_date,

            principal_amount=to_money(
                principal_component
            ),

            interest_amount=to_money(
                interest
            ),

            total_amount=to_money(
                total_amount
            ),

            # Every newly generated installment
            # starts unpaid.
            paid_amount=MONEY_ZERO,

            status="pending"
        )

        installments.append(
            installment
        )

        db.add(
            installment
        )

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    db.commit()

    # -----------------------------------------------------
    # REFRESH GENERATED INSTALLMENTS
    # -----------------------------------------------------

    for installment in installments:
        db.refresh(
            installment
        )

    return installments
