from decimal import Decimal, InvalidOperation

from rest_framework.response import Response
from rest_framework.views import APIView

from admin_logs.services import create_admin_log
from users.permissions import IsReadOnly, IsSystemAdmin

from .models import Card


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


class AdminCardListView(APIView):
    permission_classes = [IsReadOnly]

    def get(self, request):
        cards = (
            Card.objects
            .select_related("user")
            .all()
            .order_by("-created_at")
        )

        data = []

        for card in cards:
            data.append(
                {
                    "id": card.id,
                    "username": card.user.username,
                    "cardholder_name": card.cardholder_name,
                    "card_type": card.card_type,
                    "card_category": card.card_category,
                    "last_four_digits": card.last_four_digits,
                    "masked_card_number": card.masked_card_number,
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "credit_limit": str(card.credit_limit),
                    "is_active": card.is_active,
                    "created_at": card.created_at,
                }
            )

        return Response(data)


class AdminCardUpdateView(APIView):
    permission_classes = [IsSystemAdmin]

    def patch(self, request, card_id):
        if not request.data:
            return Response(
                {"detail": "Provide at least one field to update."},
                status=400,
            )

        allowed_fields = {"is_active", "credit_limit"}
        unexpected_fields = set(request.data.keys()) - allowed_fields

        if unexpected_fields:
            return Response(
                {"detail": "Only is_active and credit_limit can be updated."},
                status=400,
            )

        try:
            card = Card.objects.select_related("user").get(id=card_id)
        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=404,
            )

        changes = []

        if "is_active" in request.data:
            is_active = request.data["is_active"]

            if not isinstance(is_active, bool):
                return Response(
                    {"detail": "is_active must be true or false."},
                    status=400,
                )

            if card.is_active != is_active:
                previous_status = card.is_active
                card.is_active = is_active

                action = "UNBLOCK_CARD" if is_active else "BLOCK_CARD"

                changes.append(
                    (
                        action,
                        f"Card #{card.id} ending in "
                        f"{card.last_four_digits}: "
                        f"active status changed from "
                        f"{previous_status} to {is_active}.",
                    )
                )

        if "credit_limit" in request.data:
            try:
                credit_limit = Decimal(str(request.data["credit_limit"]))
            except (InvalidOperation, ValueError, TypeError):
                return Response(
                    {"detail": "Invalid credit limit."},
                    status=400,
                )

            if not credit_limit.is_finite() or credit_limit < 0:
                return Response(
                    {"detail": "Credit limit must be a finite, non-negative amount."},
                    status=400,
                )

            if credit_limit != card.credit_limit:
                previous_limit = card.credit_limit
                card.credit_limit = credit_limit

                changes.append(
                    (
                        "UPDATE_CREDIT_LIMIT",
                        f"Card #{card.id} ending in "
                        f"{card.last_four_digits}: credit limit "
                        f"changed from {previous_limit} to {credit_limit}.",
                    )
                )

        if changes:
            card.save()

            for action, description in changes:
                create_admin_log(
                    admin=request.user,
                    action=action,
                    description=description,
                    ip_address=get_client_ip(request),
                )

        return Response(
            {
                "id": card.id,
                "is_active": card.is_active,
                "credit_limit": str(card.credit_limit),
            }
        )
