from django.utils import timezone

from rest_framework import serializers

from .models import Card


class CardSerializer(serializers.ModelSerializer):
    card_number = serializers.CharField(
        write_only=True,
        min_length=13,
        max_length=19,
    )

    cvv = serializers.CharField(
        write_only=True,
        min_length=3,
        max_length=4,
    )

    class Meta:
        model = Card
        fields = [
            "id",
            "cardholder_name",
            "card_type",
            "card_category",
            "card_number",
            "cvv",
            "credit_limit",
            "last_four_digits",
            "masked_card_number",
            "expiry_month",
            "expiry_year",
            "is_active",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "last_four_digits",
            "masked_card_number",
            "is_active",
            "created_at",
        ]

    def validate_card_number(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "Card number must contain only digits."
            )

        if not 13 <= len(value) <= 19:
            raise serializers.ValidationError(
                "Card number must contain between 13 and 19 digits."
            )

        return value

    def validate_credit_limit(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Credit limit cannot be negative."
            )

        return value

    def validate_expiry_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError(
                "Expiry month must be between 1 and 12."
            )

        return value

    def validate_expiry_year(self, value):
        current_year = timezone.now().year

        if value < current_year:
            raise serializers.ValidationError(
                "Card has expired."
            )

        return value

    def validate_cvv(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "CVV must contain only digits."
            )

        return value

    def create(self, validated_data):
        card_number = validated_data.pop("card_number")
        validated_data.pop("cvv")

        validated_data["last_four_digits"] = card_number[-4:]

        validated_data["masked_card_number"] = (
            "*" * (len(card_number) - 4)
            + card_number[-4:]
        )

        validated_data["user"] = self.context["request"].user

        return Card.objects.create(**validated_data)