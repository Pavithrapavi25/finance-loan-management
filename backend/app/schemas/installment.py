from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class InstallmentResponse(BaseModel):
    id: int
    loan_id: int
    installment_number: int
    due_date: date

    principal_amount: Decimal
    interest_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal

    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class InstallmentPaymentUpdate(BaseModel):
    paid_amount: Decimal = Field(
        ge=0,
        decimal_places=2
    )