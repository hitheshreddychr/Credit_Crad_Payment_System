from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text

from .auth import get_current_user_id
from .database import engine
from .schemas import DashboardSummary


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    user_id: int = Depends(
        get_current_user_id
    ),
):
    total_transactions_query = text(
        """
        SELECT COUNT(*)
        FROM transactions_transaction
        WHERE user_id = :user_id
        """
    )

    total_amount_query = text(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions_transaction
        WHERE user_id = :user_id
        """
    )

    current_month_query = text(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions_transaction
        WHERE user_id = :user_id
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        """
    )

    available_credit_query = text(
        """
        SELECT COALESCE(SUM(credit_limit), 0)
        FROM cards_card
        WHERE user_id = :user_id
        AND is_active = 1
        AND card_category = 'CREDIT'
        """
    )

    last_transactions_query = text(
        """
        SELECT
            t.amount,
            c.masked_card_number,
            t.created_at,
            t.status
        FROM transactions_transaction t
        LEFT JOIN cards_card c
            ON t.card_id = c.id
        WHERE t.user_id = :user_id
        ORDER BY t.created_at DESC
        LIMIT 5
        """
    )

    with engine.connect() as connection:
        total_transactions = connection.execute(
            total_transactions_query,
            {"user_id": user_id},
        ).scalar_one()

        total_amount_spent = connection.execute(
            total_amount_query,
            {"user_id": user_id},
        ).scalar_one()

        current_month_spending = connection.execute(
            current_month_query,
            {"user_id": user_id},
        ).scalar_one()

        total_credit_limit = connection.execute(
            available_credit_query,
            {"user_id": user_id},
        ).scalar_one()

        last_transactions = connection.execute(
            last_transactions_query,
            {"user_id": user_id},
        ).mappings().all()

    available_credit_limit = (
        total_credit_limit - total_amount_spent
    )

    if available_credit_limit < 0:
        available_credit_limit = 0

    formatted_transactions = []

    for transaction in last_transactions:
        created_at = transaction["created_at"]

        if isinstance(created_at, datetime):
            transaction_date = created_at.isoformat()
        else:
            transaction_date = str(created_at)

        formatted_transactions.append(
            {
                "amount": transaction["amount"],
                "masked_card_number": (
                    transaction["masked_card_number"]
                    or "N/A"
                ),
                "date": transaction_date,
                "status": transaction["status"],
            }
        )

    return DashboardSummary(
        total_transactions=int(
            total_transactions
        ),
        total_amount_spent=total_amount_spent,
        current_month_spending=current_month_spending,
        available_credit_limit=available_credit_limit,
        last_5_transactions=formatted_transactions,
    )