from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field


class PaymentRequest(BaseModel):
    card_id: int

    amount: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )

    description: str = Field(
        default="",
        max_length=255,
    )


class PaymentResponse(BaseModel):
    transaction_id: str
    status: str
    amount: Decimal
    currency: str
    message: str


class DashboardTransaction(BaseModel):
    amount: Decimal
    masked_card_number: str
    date: str
    status: str


class DashboardSummary(BaseModel):
    total_transactions: int
    total_amount_spent: Decimal
    current_month_spending: Decimal
    available_credit_limit: Decimal
    last_5_transactions: List[DashboardTransaction]