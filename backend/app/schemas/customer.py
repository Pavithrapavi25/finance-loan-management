from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=1, max_length=20)
    email: EmailStr | None = None
    address: str | None = None
    occupation: str | None = None

    @field_validator("full_name", "phone")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty.")

        return value


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    phone: str | None = Field(
        default=None,
        min_length=1,
        max_length=20
    )

    email: EmailStr | None = None
    address: str | None = None
    occupation: str | None = None

    @field_validator("full_name", "phone")
    @classmethod
    def validate_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("This field cannot be empty.")

        return value


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }