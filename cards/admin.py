from django.contrib import admin

from .models import Card


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "cardholder_name",
        "card_type",
        "masked_card_number",
        "expiry_month",
        "expiry_year",
        "is_active",
        "created_at",
    )

    list_filter = (
        "card_type",
        "is_active",
        "created_at",
    )

    search_fields = (
        "cardholder_name",
        "last_four_digits",
        "masked_card_number",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "last_four_digits",
        "masked_card_number",
        "created_at",
        "updated_at",
    )

    ordering = (
        "-created_at",
    )