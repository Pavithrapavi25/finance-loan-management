from decimal import Decimal

from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_customers: int
    total_loans: int
    active_loans: int
    completed_loans: int
    pending_loans: int
    cancelled_loans: int
    total_principal_issued: Decimal
    total_interest: Decimal
    total_payable: Decimal
    total_collected: Decimal
    outstanding_amount: Decimal

    overdue_installments: int
    repayment_progress: Decimal

    active_loan_amount: Decimal
    average_loan_amount: Decimal