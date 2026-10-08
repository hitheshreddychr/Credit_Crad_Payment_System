from decimal import Decimal

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from cards.models import Card
from notifications.services import (
    send_card_blocked_email,
    send_high_value_transaction_email,
    send_low_credit_email,
)
from transactions.models import Transaction


@receiver(pre_save, sender=Transaction)
def transaction_pre_save(
    sender,
    instance,
    **kwargs,
):
    if not instance.pk:
        instance._previous_status = None
        return

    try:
        previous = sender.objects.get(
            pk=instance.pk
        )
        instance._previous_status = previous.status
    except sender.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=Transaction)
def transaction_notification(
    sender,
    instance,
    created,
    **kwargs,
):
    previous_status = getattr(
        instance,
        "_previous_status",
        None,
    )

    became_successful = (
        instance.status == "SUCCESS"
        and (
            created
            or previous_status != "SUCCESS"
        )
    )

    if not became_successful:
        return

    if Decimal(instance.amount) > Decimal("5000"):
        send_high_value_transaction_email(
            instance
        )

    cards = Card.objects.filter(
        user=instance.user,
        is_active=True,
    )

    credit_limit = sum(
        (
            card.credit_limit
            for card in cards
        ),
        Decimal("0"),
    )

    successful_spending = sum(
        (
            transaction.amount
            for transaction in Transaction.objects.filter(
                user=instance.user,
                status="SUCCESS",
            )
        ),
        Decimal("0"),
    )

    available_credit = max(
        credit_limit - successful_spending,
        Decimal("0"),
    )

    if (
        credit_limit > 0
        and available_credit
        < credit_limit * Decimal("0.10")
    ):
        send_low_credit_email(
            instance.user,
            available_credit,
            credit_limit,
        )


@receiver(pre_save, sender=Card)
def card_pre_save(
    sender,
    instance,
    **kwargs,
):
    if not instance.pk:
        instance._previous_is_active = None
        return

    try:
        previous = sender.objects.get(
            pk=instance.pk
        )
        instance._previous_is_active = (
            previous.is_active
        )
    except sender.DoesNotExist:
        instance._previous_is_active = None


@receiver(post_save, sender=Card)
def card_notification(
    sender,
    instance,
    created,
    **kwargs,
):
    previous_is_active = getattr(
        instance,
        "_previous_is_active",
        None,
    )

    was_blocked = (
        not instance.is_active
        and (
            previous_is_active is True
        )
    )

    if was_blocked:
        send_card_blocked_email(instance)