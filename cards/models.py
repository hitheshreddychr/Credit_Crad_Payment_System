from django.conf import settings
from django.db import models


class Card(models.Model):
    CARD_TYPES = [
        ("VISA", "Visa"),
        ("MASTERCARD", "Mastercard"),
        ("AMEX", "American Express"),
        ("RUPAY", "RuPay"),
    ]

    CARD_CATEGORY_CHOICES = [
        ("CREDIT", "Credit"),
        ("DEBIT", "Debit"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cards",
    )

    cardholder_name = models.CharField(
        max_length=100,
    )

    card_type = models.CharField(
        max_length=20,
        choices=CARD_TYPES,
    )

    card_category = models.CharField(
        max_length=10,
        choices=CARD_CATEGORY_CHOICES,
    )

    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=100000.00,
    )

    last_four_digits = models.CharField(
        max_length=4,
    )

    masked_card_number = models.CharField(
        max_length=19,
    )

    expiry_month = models.PositiveSmallIntegerField()

    expiry_year = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.card_type} **** {self.last_four_digits}"