from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Customer, Installment, Loan, Reminder


# Number of days before the installment due date
# that the automatic reminder should be scheduled.
REMINDER_LEAD_DAYS = 2

def create_upcoming_installment_reminders(
    db: Session,
    days_ahead: int = 3
):
   
    today = date.today()

    reminder_limit = today + timedelta(days=days_ahead)

    installments = (
        db.query(Installment)
        .join(
            Loan,
            Installment.loan_id == Loan.id
        )
        .filter(
            Installment.due_date >= today,
            Installment.due_date <= reminder_limit,
            Installment.paid_amount < Installment.total_amount,
            Loan.status == "active"
        )
        .all()
    )

    created_reminders = []

    for installment in installments:

        # Find the loan connected to this installment.
        loan = db.query(Loan).filter(
            Loan.id == installment.loan_id
        ).first()

        if not loan:
            continue

        # Find the customer connected to this loan.
        customer = db.query(Customer).filter(
            Customer.id == loan.customer_id
        ).first()

        if not customer:
            continue

        # Calculate the remaining installment amount.
        total_amount = installment.total_amount or 0
        paid_amount = installment.paid_amount or 0

        remaining_amount = total_amount - paid_amount

        # Safety check: do not create a reminder if nothing remains.
        if remaining_amount <= 0:
            continue

        # Schedule the reminder 2 days before the installment due date.
        #
        # If the due date is today or tomorrow, the reminder
        # should be created for today instead of using a past date.
        calculated_reminder_date = (
            installment.due_date
            - timedelta(days=REMINDER_LEAD_DAYS)
        )

        reminder_date = max(
            today,
            calculated_reminder_date
        )

        # Avoid duplicate reminders for the same installment date.
        #
        # We check the reminder date as well because one loan can
        # contain many installments and therefore many reminders.
        existing_reminder = db.query(Reminder).filter(
            Reminder.loan_id == loan.id,
            Reminder.customer_id == customer.id,
            Reminder.reminder_type == "payment_due",
            Reminder.reminder_date == reminder_date
        ).first()

        if existing_reminder:
            continue

        # Create the automatic reminder.
        reminder = Reminder(
            customer_id=customer.id,
            loan_id=loan.id,
            reminder_type="payment_due",
            message=(
                f"Your remaining installment amount of "
                f"₹{remaining_amount:.2f} "
                f"is due on {installment.due_date}."
            ),
            reminder_date=reminder_date,
            is_sent=False
        )

        db.add(reminder)

        created_reminders.append(reminder)

    db.commit()

    # Refresh newly created reminders so their generated
    # database values, such as ID, are available.
    for reminder in created_reminders:
        db.refresh(reminder)

    return created_reminders
