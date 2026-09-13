from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Customer, User
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


# Create customer
@router.post(
    "",
    response_model=CustomerResponse
)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_customer = db.query(Customer).filter(
        Customer.phone == customer_data.phone
    ).first()

    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="Customer with this phone number already exists"
        )

    new_customer = Customer(
        full_name=customer_data.full_name,
        phone=customer_data.phone,
        email=customer_data.email,
        address=customer_data.address,
        occupation=customer_data.occupation
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


# Get all customers
@router.get(
    "",
    response_model=list[CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = db.query(Customer).order_by(
        Customer.id.desc()
    ).all()

    return customers


# Search customers
@router.get(
    "/search",
    response_model=list[CustomerResponse]
)
def search_customers(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search_term = f"%{q}%"

    customers = db.query(Customer).filter(
        or_(
            Customer.full_name.ilike(search_term),
            Customer.phone.ilike(search_term),
            Customer.email.ilike(search_term)
        )
    ).order_by(
        Customer.id.desc()
    ).all()

    return customers


# Get one customer by ID
@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


# Update customer
@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if customer_data.phone is not None:
        existing_customer = db.query(Customer).filter(
            Customer.phone == customer_data.phone,
            Customer.id != customer_id
        ).first()

        if existing_customer:
            raise HTTPException(
                status_code=400,
                detail="Customer with this phone number already exists"
            )

    if customer_data.full_name is not None:
        customer.full_name = customer_data.full_name

    if customer_data.phone is not None:
        customer.phone = customer_data.phone

    if customer_data.email is not None:
        customer.email = customer_data.email

    if customer_data.address is not None:
        customer.address = customer_data.address

    if customer_data.occupation is not None:
        customer.occupation = customer_data.occupation

    db.commit()
    db.refresh(customer)

    return customer


# Delete customer
@router.delete(
    "/{customer_id}"
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    db.delete(customer)
    db.commit()

    return {
        "message": "Customer deleted successfully",
        "customer_id": customer_id
    }