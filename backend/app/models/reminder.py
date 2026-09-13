from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"),
        nullable=False,
        index=True
    )

    loan_id: Mapped[int | None] = mapped_column(
        ForeignKey("loans.id"),
        nullable=True,
        index=True
    )

    reminder_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    reminder_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    is_sent: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    customer = relationship(
        "Customer",
        back_populates="reminders"
    )

    loan = relationship(
        "Loan",
        back_populates="reminders"
    )