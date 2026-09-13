from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Customer,
    Loan,
    Payment,
    Installment
)


# =========================================================
# DECIMAL HELPER
# =========================================================

MONEY_ZERO = Decimal("0.00")


def to_money(value) -> Decimal:
    """
    Safely convert database numeric values to Decimal
    with two decimal places.
    """

    if value is None:
        value = MONEY_ZERO

    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


# =========================================================
# UPCOMING PAYMENTS
# =========================================================

def get_upcoming_payments(
    db: Session,
    days_ahead: int = 7
) -> list[dict]:
    """
    Get unpaid installments due within the next few days.
    """

    today = date.today()
    end_date = today + timedelta(days=days_ahead)

    upcoming_installments = (
        db.query(
            Installment,
            Customer.full_name
        )
        .join(
            Loan,
            Installment.loan_id == Loan.id
        )
        .join(
            Customer,
            Loan.customer_id == Customer.id
        )
        .filter(
            Installment.due_date >= today,
            Installment.due_date <= end_date,
            Installment.paid_amount < Installment.total_amount,
            Loan.status == "active"
        )
        .order_by(
            Installment.due_date
        )
        .all()
    )

    upcoming_payments = []

    for installment, customer_name in upcoming_installments:

        total_amount = to_money(
            installment.total_amount
        )

        paid_amount = to_money(
            installment.paid_amount
        )

        remaining_amount = (
            total_amount - paid_amount
        )

        if remaining_amount < MONEY_ZERO:
            remaining_amount = MONEY_ZERO

        upcoming_payments.append({
            "installment_id": installment.id,
            "loan_id": installment.loan_id,
            "customer_name": customer_name,
            "installment_number": installment.installment_number,
            "due_date": installment.due_date,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "remaining_amount": remaining_amount,
            "status": installment.status
        })

    return upcoming_payments


# =========================================================
# OVERDUE PAYMENTS
# =========================================================

def get_overdue_payments(
    db: Session
) -> list[dict]:
    """
    Get unpaid installments whose due date has already passed.
    """

    today = date.today()

    overdue_installments = (
        db.query(
            Installment,
            Customer.full_name
        )
        .join(
            Loan,
            Installment.loan_id == Loan.id
        )
        .join(
            Customer,
            Loan.customer_id == Customer.id
        )
        .filter(
            Installment.due_date < today,
            Installment.paid_amount < Installment.total_amount,
            Loan.status == "active"
        )
        .order_by(
            Installment.due_date
        )
        .all()
    )

    overdue_payments = []

    for installment, customer_name in overdue_installments:

        total_amount = to_money(
            installment.total_amount
        )

        paid_amount = to_money(
            installment.paid_amount
        )

        remaining_amount = (
            total_amount - paid_amount
        )

        if remaining_amount < MONEY_ZERO:
            remaining_amount = MONEY_ZERO

        overdue_days = (
            today - installment.due_date
        ).days

        overdue_payments.append({
            "installment_id": installment.id,
            "loan_id": installment.loan_id,
            "customer_name": customer_name,
            "installment_number": installment.installment_number,
            "due_date": installment.due_date,
            "total_amount": total_amount,
            "paid_amount": paid_amount,
            "remaining_amount": remaining_amount,
            "overdue_days": overdue_days,
            "status": "overdue"
        })

    return overdue_payments


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

def get_dashboard_summary(
    db: Session
) -> dict:
    """
    Calculate the main business metrics required
    for the finance dashboard.

    Step 7.10 Part 2:
    Protect calculations against:

    - partial payments
    - fully paid installments
    - loans with no payments
    - completed loans
    - zero payable amounts
    - negative outstanding amounts
    - repayment progress above 100%
    - Decimal rounding issues
    """

    # -----------------------------------------------------
    # CUSTOMER COUNT
    # -----------------------------------------------------

    total_customers = db.query(
        func.count(Customer.id)
    ).scalar() or 0

    # -----------------------------------------------------
    # LOAN COUNTS
    # -----------------------------------------------------

    total_loans = db.query(
        func.count(Loan.id)
    ).scalar() or 0

    active_loans = db.query(
        func.count(Loan.id)
    ).filter(
        Loan.status == "active"
    ).scalar() or 0

    completed_loans = db.query(
        func.count(Loan.id)
    ).filter(
        Loan.status == "completed"
    ).scalar() or 0

    pending_loans = db.query(
        func.count(Loan.id)
    ).filter(
        Loan.status == "pending"
    ).scalar() or 0

    cancelled_loans = db.query(
        func.count(Loan.id)
    ).filter(
        Loan.status == "cancelled"
    ).scalar() or 0

    # -----------------------------------------------------
    # ACTIVE LOAN AMOUNT
    # -----------------------------------------------------

    active_loan_amount = db.query(
        func.coalesce(
            func.sum(Loan.principal_amount),
            0
        )
    ).filter(
        Loan.status == "active"
    ).scalar()

    active_loan_amount = to_money(
        active_loan_amount
    )

    # -----------------------------------------------------
    # AVERAGE LOAN AMOUNT
    # -----------------------------------------------------

    average_loan_amount = db.query(
        func.coalesce(
            func.avg(Loan.principal_amount),
            0
        )
    ).scalar()

    average_loan_amount = to_money(
        average_loan_amount
    )

    # -----------------------------------------------------
    # TOTAL PRINCIPAL ISSUED
    # -----------------------------------------------------

    total_principal = db.query(
        func.coalesce(
            func.sum(Loan.principal_amount),
            0
        )
    ).scalar()

    total_principal = to_money(
        total_principal
    )

    # -----------------------------------------------------
    # TOTAL INTEREST
    #
    # Interest is calculated from all installments.
    # This keeps the dashboard aligned with the actual
    # installment schedule.
    # -----------------------------------------------------

    total_interest = db.query(
        func.coalesce(
            func.sum(Installment.interest_amount),
            0
        )
    ).scalar()

    total_interest = to_money(
        total_interest
    )

    # -----------------------------------------------------
    # TOTAL PAYABLE
    #
    # Business rule:
    #
    # Total Payable = Principal + Interest
    #
    # This is calculated independently from payments.
    # -----------------------------------------------------

    total_payable = (
        total_principal +
        total_interest
    )

    total_payable = to_money(
        total_payable
    )

    # -----------------------------------------------------
    # TOTAL PAYMENTS COLLECTED
    #
    # A loan with no payments naturally contributes ₹0.
    # Partial payments are included exactly as collected.
    # -----------------------------------------------------

    total_collected = db.query(
        func.coalesce(
            func.sum(Payment.amount),
            0
        )
    ).scalar()

    total_collected = to_money(
        total_collected
    )

    # -----------------------------------------------------
    # OUTSTANDING AMOUNT
    #
    # Business rule:
    #
    # Outstanding = Total Payable - Total Collected
    #
    # Never allow dashboard outstanding to become negative.
    # -----------------------------------------------------

    outstanding_amount = (
        total_payable -
        total_collected
    )

    outstanding_amount = to_money(
        outstanding_amount
    )

    if outstanding_amount < MONEY_ZERO:
        outstanding_amount = MONEY_ZERO

    # -----------------------------------------------------
    # OVERDUE INSTALLMENTS
    #
    # Only unpaid/partially-paid installments belonging
    # to active loans are counted.
    # -----------------------------------------------------

    overdue_installments = db.query(
        func.count(Installment.id)
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date < date.today(),
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).scalar() or 0

    # -----------------------------------------------------
    # REPAYMENT PROGRESS
    #
    # Protect against:
    #
    # - division by zero
    # - no payments
    # - partial payments
    # - overpayments
    #
    # Result is always between 0% and 100%.
    # -----------------------------------------------------

    if total_payable <= MONEY_ZERO:

        repayment_progress = MONEY_ZERO

    else:

        repayment_progress = (
            total_collected /
            total_payable
        ) * Decimal("100")

    repayment_progress = to_money(
        repayment_progress
    )

    if repayment_progress < MONEY_ZERO:
        repayment_progress = MONEY_ZERO

    if repayment_progress > Decimal("100.00"):
        repayment_progress = Decimal("100.00")

    # -----------------------------------------------------
    # RETURN DASHBOARD DATA
    # -----------------------------------------------------

    return {
        "total_customers": total_customers,
        "total_loans": total_loans,
        "active_loans": active_loans,
        "completed_loans": completed_loans,
        "pending_loans": pending_loans,
        "cancelled_loans": cancelled_loans,

        "total_principal_issued": total_principal,
        "total_interest": total_interest,
        "total_payable": total_payable,
        "total_collected": total_collected,
        "outstanding_amount": outstanding_amount,

        "overdue_installments": overdue_installments,
        "repayment_progress": repayment_progress,

        "active_loan_amount": active_loan_amount,
        "average_loan_amount": average_loan_amount
    }


# =========================================================
# LOAN STATUS OVERVIEW
# =========================================================

def get_loan_status_overview(
    db: Session
) -> dict:
    """
    Get the number of loans grouped by status.
    """

    active = db.query(
        Loan
    ).filter(
        Loan.status == "active"
    ).count()

    completed = db.query(
        Loan
    ).filter(
        Loan.status == "completed"
    ).count()

    pending = db.query(
        Loan
    ).filter(
        Loan.status == "pending"
    ).count()

    cancelled = db.query(
        Loan
    ).filter(
        Loan.status == "cancelled"
    ).count()

    return {
        "active": active,
        "completed": completed,
        "pending": pending,
        "cancelled": cancelled
    }


# =========================================================
# PAYMENT COLLECTION SUMMARY
# =========================================================

def get_payment_collection_summary(
    db: Session
) -> list[dict]:
    """
    Get total collected amount grouped by payment method.
    """

    results = (
        db.query(
            Payment.payment_method,
            func.sum(
                Payment.amount
            ).label(
                "total_collected"
            )
        )
        .group_by(
            Payment.payment_method
        )
        .order_by(
            Payment.payment_method
        )
        .all()
    )

    return [
        {
            "payment_method": payment_method,
            "total_collected": to_money(
                total_collected
            )
        }
        for payment_method, total_collected
        in results
    ]


# =========================================================
# BUSINESS INSIGHTS
# =========================================================

def get_business_insights(
    db: Session
) -> dict:
    """
    Calculate useful business insights for the dashboard.
    """

    today = date.today()

    # -----------------------------------------------------
    # ACTIVE CUSTOMERS
    # Customers who currently have at least one active loan
    # -----------------------------------------------------

    active_customers = db.query(
        func.count(
            func.distinct(Loan.customer_id)
        )
    ).filter(
        Loan.status == "active"
    ).scalar() or 0

    # -----------------------------------------------------
    # DUE SOON
    # Installments due within the next 7 days
    # -----------------------------------------------------

    next_7_days = today + timedelta(days=7)

    due_soon_query = db.query(
        Installment
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date >= today,
        Installment.due_date <= next_7_days,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    )

    due_soon_count = due_soon_query.count()

    due_soon_amount = db.query(
        func.coalesce(
            func.sum(
                Installment.total_amount -
                Installment.paid_amount
            ),
            0
        )
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date >= today,
        Installment.due_date <= next_7_days,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).scalar()

    due_soon_amount = to_money(
        due_soon_amount
    )

    if due_soon_amount < MONEY_ZERO:
        due_soon_amount = MONEY_ZERO

    # -----------------------------------------------------
    # OVERDUE AMOUNT
    # -----------------------------------------------------

    overdue_amount = db.query(
        func.coalesce(
            func.sum(
                Installment.total_amount -
                Installment.paid_amount
            ),
            0
        )
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date < today,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).scalar()

    overdue_amount = to_money(
        overdue_amount
    )

    if overdue_amount < MONEY_ZERO:
        overdue_amount = MONEY_ZERO

    # -----------------------------------------------------
    # COLLECTION THIS MONTH
    # -----------------------------------------------------

    month_start = today.replace(day=1)

    collection_this_month = db.query(
        func.coalesce(
            func.sum(Payment.amount),
            0
        )
    ).filter(
        Payment.payment_date >= month_start,
        Payment.payment_date <= today
    ).scalar()

    collection_this_month = to_money(
        collection_this_month
    )

    # -----------------------------------------------------
    # RETURN INSIGHTS
    # -----------------------------------------------------

    return {
        "active_customers": active_customers,
        "due_soon_count": due_soon_count,
        "due_soon_amount": due_soon_amount,
        "overdue_amount": overdue_amount,
        "collection_this_month": collection_this_month
    }


# =========================================================
# DASHBOARD ALERTS
# =========================================================

def get_dashboard_alerts(
    db: Session
) -> dict:
    """
    Return important items that need attention
    on the dashboard.
    """

    today = date.today()

    # -----------------------------------------------------
    # OVERDUE PAYMENTS
    # -----------------------------------------------------

    overdue_count = db.query(
        Installment
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date < today,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).count()

    overdue_amount = db.query(
        func.coalesce(
            func.sum(
                Installment.total_amount -
                Installment.paid_amount
            ),
            0
        )
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date < today,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).scalar()

    overdue_amount = to_money(
        overdue_amount
    )

    if overdue_amount < MONEY_ZERO:
        overdue_amount = MONEY_ZERO

    # -----------------------------------------------------
    # PAYMENTS DUE IN NEXT 7 DAYS
    # -----------------------------------------------------

    next_7_days = today + timedelta(days=7)

    due_soon_count = db.query(
        Installment
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date >= today,
        Installment.due_date <= next_7_days,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).count()

    due_soon_amount = db.query(
        func.coalesce(
            func.sum(
                Installment.total_amount -
                Installment.paid_amount
            ),
            0
        )
    ).join(
        Loan,
        Installment.loan_id == Loan.id
    ).filter(
        Installment.due_date >= today,
        Installment.due_date <= next_7_days,
        Installment.paid_amount < Installment.total_amount,
        Loan.status == "active"
    ).scalar()

    due_soon_amount = to_money(
        due_soon_amount
    )

    if due_soon_amount < MONEY_ZERO:
        due_soon_amount = MONEY_ZERO

    # -----------------------------------------------------
    # TOTAL ALERTS
    # -----------------------------------------------------

    total_alerts = (
        overdue_count +
        due_soon_count
    )

    return {
        "total_alerts": total_alerts,
        "overdue_count": overdue_count,
        "overdue_amount": overdue_amount,
        "due_soon_count": due_soon_count,
        "due_soon_amount": due_soon_amount
    }
