from decimal import Decimal

from django.conf import settings
from django.core.mail import send_mail


def send_notification_email(
    user,
    subject,
    message,
):
    email = getattr(user, "email", None)

    if not email:
        return

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
    )


def send_high_value_transaction_email(transaction):
    send_notification_email(
        transaction.user,
        "High-Value Transaction Alert",
        (
            f"Dear {transaction.user.username},\n\n"
            f"A transaction of ₹{transaction.amount} "
            "has been completed using your card.\n\n"
            f"Transaction ID: {transaction.transaction_id}\n"
            f"Amount: ₹{transaction.amount}\n"
            f"Status: {transaction.status}\n\n"
            "If you did not authorize this transaction, "
            "please contact support immediately."
        ),
    )


def send_card_blocked_email(card):
    send_notification_email(
        card.user,
        "Card Blocked Alert",
        (
            f"Dear {card.user.username},\n\n"
            f"Your card ending in {card.last_four_digits} "
            "has been blocked.\n\n"
            "Please contact support if you believe this "
            "was done incorrectly."
        ),
    )


def send_low_credit_email(
    user,
    available_credit,
    credit_limit,
):
    percentage = (
        available_credit / credit_limit * Decimal("100")
        if credit_limit > 0
        else Decimal("0")
    )

    send_notification_email(
        user,
        "Low Available Credit Alert",
        (
            f"Dear {user.username},\n\n"
            "Your available credit has fallen below 10% "
            "of your total credit limit.\n\n"
            f"Total Credit Limit: ₹{credit_limit}\n"
            f"Available Credit: ₹{available_credit}\n"
            f"Available Credit Percentage: "
            f"{percentage:.2f}%\n\n"
            "Please review your recent spending."
        ),
    )