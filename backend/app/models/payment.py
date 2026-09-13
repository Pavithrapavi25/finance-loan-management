
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    loan_id: Mapped[int] = mapped_column(
        ForeignKey("loans.id"),
        nullable=False,
        index=True
    )

    installment_id: Mapped[int | None] = mapped_column(
        ForeignKey("installments.id"),
        nullable=True,
        index=True
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    payment_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        default=date.today
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="cash"
    )

    reference_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    loan = relationship(
        "Loan",
        back_populates="payments"
    )

    installment = relationship(
        "Installment",
        back_populates="payments"
    )
