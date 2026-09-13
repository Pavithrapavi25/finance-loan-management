from datetime import datetime

from pydantic import BaseModel


class ReminderCreate(BaseModel):
    customer_id: int
    loan_id: int | None = None
    reminder_type: str
    message: str
    reminder_date: datetime
class ReminderStatusUpdate(BaseModel):
    is_sent: bool
class ReminderResponse(BaseModel):
    id: int
    customer_id: int
    loan_id: int | None
    reminder_type: str
    message: str
    reminder_date: datetime
    is_sent: bool
    created_at: datetime

    model_config = {
        "from_attributes": True
    }