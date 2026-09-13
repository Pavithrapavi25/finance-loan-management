from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class PaymentCreate(BaseModel):
    loan_id: int
    installment_id: int | None = None

    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    payment_date: date

    payment_method: str

    reference_number: str | None = None

    notes: str | None = None

    # =========================================
    # PAYMENT DATE VALIDATION
    # =========================================

    @field_validator("payment_date")
    @classmethod
    def validate_payment_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError(
                "Payment date cannot be in the future."
            )

        return value

    # =========================================
    # PAYMENT METHOD VALIDATION
    # =========================================

    @field_validator("payment_method")
    @classmethod
    def validate_payment_method(cls, value: str) -> str:
        value = value.strip()

        allowed_methods = {
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque"
        }

        if value not in allowed_methods:
            raise ValueError(
                "Payment method must be Cash, UPI, Bank Transfer, or Cheque."
            )

        return value


class PaymentResponse(BaseModel):
    id: int
    loan_id: int
    installment_id: int | None

    amount: Decimal
    payment_date: date
    payment_method: str

    reference_number: str | None
    notes: str | None

    created_at: datetime

    model_config = {
        "from_attributes": True
    }