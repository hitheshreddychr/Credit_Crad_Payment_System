from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from admin_logs.services import create_admin_log
from notifications.services import send_notification_email
from .models import Transaction


HIGH_VALUE_THRESHOLD = Decimal("5000.00")
HIGH_VALUE_WINDOW_MINUTES = 10
HIGH_VALUE_TRANSACTION_COUNT = 3
RAPID_ACTIVITY_WINDOW_SECONDS = 120


def evaluate_transaction_fraud(
    transaction,
    ip_address=None,
    device_fingerprint="",
):
    reasons = []
    now = timezone.now()

    high_value_window_start = now - timedelta(
        minutes=HIGH_VALUE_WINDOW_MINUTES
    )

    user_transactions = Transaction.objects.filter(
        user=transaction.user,
        status__in=["PENDING", "SUCCESS"],
    ).exclude(pk=transaction.pk)

    recent_transactions = [
        item
        for item in user_transactions
        if item.created_at is not None
        and item.created_at >= high_value_window_start
    ]

    recent_high_value_count = sum(
        1
        for item in recent_transactions
        if item.amount >= HIGH_VALUE_THRESHOLD
    )

    if (
        transaction.amount >= HIGH_VALUE_THRESHOLD
        and recent_high_value_count >= HIGH_VALUE_TRANSACTION_COUNT - 1
    ):
        reasons.append(
            "Multiple high-value transactions within 10 minutes."
        )

    rapid_window_start = now - timedelta(
        seconds=RAPID_ACTIVITY_WINDOW_SECONDS
    )

    rapid_transactions = [
        item
        for item in user_transactions
        if item.created_at is not None
        and item.created_at >= rapid_window_start
    ]

    if ip_address and any(
        item.ip_address
        and item.ip_address != ip_address
        for item in rapid_transactions
    ):
        reasons.append(
            "Rapid transactions from different IP addresses."
        )

    if device_fingerprint and any(
        item.device_fingerprint
        and item.device_fingerprint != device_fingerprint
        for item in rapid_transactions
    ):
        reasons.append(
            "Rapid transactions from different devices."
        )

    if not reasons:
        return {
            "is_suspicious": False,
            "reasons": [],
        }

    fraud_reason = " ".join(reasons)

    description = (
        f"Potential fraud detected for transaction "
        f"{transaction.transaction_id}. Reasons: {fraud_reason}"
    )

    create_admin_log(
        admin=None,
        action="FRAUD_ALERT",
        description=description,
        ip_address=ip_address,
    )

    send_notification_email(
        transaction.user,
        "Suspicious Transaction Alert",
        (
            f"Dear {transaction.user.username},\n\n"
            "We detected potentially suspicious activity "
            "involving your account.\n\n"
            f"Transaction ID: {transaction.transaction_id}\n"
            f"Amount: {transaction.amount} {transaction.currency}\n"
            f"Reason: {fraud_reason}\n\n"
            "If you did not authorize this activity, "
            "please contact support immediately."
        ),
    )

    return {
        "is_suspicious": True,
        "reasons": reasons,
    }
