from decimal import Decimal

from rest_framework import serializers

from .models import Transaction


class PaymentSerializer(serializers.Serializer):
    card_id = serializers.IntegerField(
        min_value=1,
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    currency = serializers.CharField(
        max_length=3,
        default="INR",
    )

    description = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
    )

    def validate_currency(self, value):
        value = value.strip().upper()

        if len(value) != 3 or not value.isalpha():
            raise serializers.ValidationError(
                "Currency must contain three letters."
            )

        return value


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "transaction_id",
            "amount",
            "currency",
            "payment_method",
            "status",
            "description",
            "failure_reason",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "transaction_id",
            "payment_method",
            "status",
            "failure_reason",
            "created_at",
            "updated_at",
        ]