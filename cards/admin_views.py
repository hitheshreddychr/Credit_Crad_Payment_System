from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Card


def is_admin(user):
    return user.is_admin or user.is_staff


class AdminCardListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

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
                    "masked_card_number": (
                        card.masked_card_number
                    ),
                    "expiry_month": card.expiry_month,
                    "expiry_year": card.expiry_year,
                    "credit_limit": str(
                        card.credit_limit
                    ),
                    "is_active": card.is_active,
                    "created_at": card.created_at,
                }
            )

        return Response(data)


class AdminCardUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, card_id):
        if not is_admin(request.user):
            return Response(
                {"detail": "Admin access required."},
                status=403,
            )

        try:
            card = Card.objects.get(
                id=card_id
            )
        except Card.DoesNotExist:
            return Response(
                {"detail": "Card not found."},
                status=404,
            )

        if "is_active" in request.data:
            is_active = request.data["is_active"]

            if not isinstance(
                is_active,
                bool,
            ):
                return Response(
                    {
                        "detail":
                        "is_active must be true or false."
                    },
                    status=400,
                )

            card.is_active = is_active

        if "credit_limit" in request.data:
            try:
                credit_limit = Decimal(
                    str(
                        request.data[
                            "credit_limit"
                        ]
                    )
                )
            except Exception:
                return Response(
                    {
                        "detail":
                        "Invalid credit limit."
                    },
                    status=400,
                )

            if credit_limit < 0:
                return Response(
                    {
                        "detail":
                        "Credit limit cannot be negative."
                    },
                    status=400,
                )

            card.credit_limit = credit_limit

        card.save()

        return Response(
            {
                "id": card.id,
                "is_active": card.is_active,
                "credit_limit": str(
                    card.credit_limit
                ),
            }
        )