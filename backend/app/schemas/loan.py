from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class LoanBase(BaseModel):
    principal_amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    interest_rate: Decimal = Field(
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2
    )

    interest_type: str

    tenure_months: int = Field(
        gt=0
    )

    start_date: date

    maturity_date: date

    purpose: str | None = None

    @field_validator("interest_type")
    @classmethod
    def validate_interest_type(cls, value: str) -> str:
        value = value.strip().lower()

        allowed_types = {"reducing", "flat"}

        if value not in allowed_types:
            raise ValueError(
                "Interest type must be either 'reducing' or 'flat'."
            )

        return value


class LoanCreate(LoanBase):
    customer_id: int


class LoanUpdate(BaseModel):
    principal_amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    interest_rate: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2
    )

    interest_type: str | None = None

    tenure_months: int | None = Field(
        default=None,
        gt=0
    )

    start_date: date | None = None

    maturity_date: date | None = None

    status: str | None = None

    purpose: str | None = None

    @field_validator("interest_type")
    @classmethod
    def validate_interest_type(
        cls,
        value: str | None
    ) -> str | None:
        if value is None:
            return None

        value = value.strip().lower()

        allowed_types = {"reducing", "flat"}

        if value not in allowed_types:
            raise ValueError(
                "Interest type must be either 'reducing' or 'flat'."
            )

        return value


class LoanResponse(LoanBase):
    id: int
    customer_id: int
    status: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }