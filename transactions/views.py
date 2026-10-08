import csv
import requests

from datetime import datetime, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django.utils.crypto import get_random_string

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cards.models import Card
from notifications.services import (
    send_high_value_transaction_email,
    send_low_credit_email,
)

from .models import Transaction
from .serializers import PaymentSerializer, TransactionSerializer


FASTAPI_PAYMENT_URL = (
    f"http://{getattr(settings, 'FASTAPI_HOST', '127.0.0.1')}:"
    f"{getattr(settings, 'FASTAPI_PORT', '8001')}"
    "/payments/process/"
)


class PaymentProcessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        card_id = serializer.validated_data["card_id"]
        amount = serializer.validated_data["amount"]
        currency = serializer.validated_data["currency"].upper()
        description = serializer.validated_data.get(
            "description",
            "",
        )

        try:
            card = Card.objects.get(
                id=card_id,
                user=request.user,
                is_active=True,
            )
        except Card.DoesNotExist:
            return Response(
                {
                    "message": "Active card not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        transaction_id = (
            "TXN-"
            + get_random_string(
                12,
                allowed_chars=(
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                ),
            )
        )

        payment_transaction = Transaction.objects.create(
            user=request.user,
            card=card,
            transaction_id=transaction_id,
            amount=amount,
            currency=currency,
            payment_method="CARD",
            status="PENDING",
            description=description,
            failure_reason="",
        )

        payment_data = {
            "card_id": card.id,
            "amount": str(amount),
            "currency": currency,
            "description": description,
        }

        try:
            fastapi_response = requests.post(
                FASTAPI_PAYMENT_URL,
                json=payment_data,
                timeout=10,
            )

            fastapi_response.raise_for_status()

            payment_result = fastapi_response.json()

        except requests.RequestException:
            payment_transaction.status = "FAILED"
            payment_transaction.failure_reason = (
                "Payment service is unavailable."
            )

            payment_transaction.save(
                update_fields=[
                    "status",
                    "failure_reason",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "message": "Payment service is unavailable.",
                    "transaction": TransactionSerializer(
                        payment_transaction
                    ).data,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        fastapi_transaction_id = payment_result.get(
            "transaction_id"
        )

        payment_status = payment_result.get(
            "status",
            "FAILED",
        )

        payment_transaction.status = payment_status

        if fastapi_transaction_id:
            payment_transaction.transaction_id = (
                fastapi_transaction_id
            )

        if payment_status == "SUCCESS":
            payment_transaction.failure_reason = ""

            if amount > Decimal("5000"):
                send_high_value_transaction_email(
                    payment_transaction
                )

            active_cards = Card.objects.filter(
                user=request.user,
                is_active=True,
            )

            total_credit_limit = sum(
                (
                    card_item.credit_limit
                    for card_item in active_cards
                ),
                Decimal("0"),
            )

            successful_spending = sum(
                (
                    transaction.amount
                    for transaction in Transaction.objects.filter(
                        user=request.user,
                        status="SUCCESS",
                    )
                ),
                Decimal("0"),
            )

            available_credit = (
                total_credit_limit - successful_spending
            )

            if (
                total_credit_limit > 0
                and available_credit / total_credit_limit
                < Decimal("0.10")
            ):
                send_low_credit_email(
                    request.user,
                    available_credit,
                    total_credit_limit,
                )

        else:
            payment_transaction.failure_reason = (
                payment_result.get(
                    "message",
                    "Payment failed.",
                )
            )

        payment_transaction.save(
            update_fields=[
                "transaction_id",
                "status",
                "failure_reason",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": payment_result.get(
                    "message",
                    "Payment processed.",
                ),
                "transaction": TransactionSerializer(
                    payment_transaction
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class TransactionHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(
            user=self.request.user
        ).select_related(
            "card"
        )

        transaction_status = self.request.query_params.get(
            "status"
        )

        currency = self.request.query_params.get(
            "currency"
        )

        min_amount = self.request.query_params.get(
            "min_amount"
        )

        max_amount = self.request.query_params.get(
            "max_amount"
        )

        from_date = self.request.query_params.get(
            "from_date"
        )

        to_date = self.request.query_params.get(
            "to_date"
        )

        if transaction_status:
            queryset = queryset.filter(
                status=transaction_status.upper()
            )

        if currency:
            queryset = queryset.filter(
                currency=currency.upper()
            )

        if min_amount:
            try:
                queryset = queryset.filter(
                    amount__gte=min_amount
                )
            except (TypeError, ValueError):
                pass

        if max_amount:
            try:
                queryset = queryset.filter(
                    amount__lte=max_amount
                )
            except (TypeError, ValueError):
                pass

        if from_date:
            try:
                start_date = datetime.strptime(
                    from_date,
                    "%Y-%m-%d",
                ).date()

                start_datetime = timezone.make_aware(
                    datetime.combine(
                        start_date,
                        time.min,
                    )
                )

                queryset = queryset.filter(
                    created_at__gte=start_datetime
                )
            except ValueError:
                pass

        if to_date:
            try:
                end_date = datetime.strptime(
                    to_date,
                    "%Y-%m-%d",
                ).date()

                end_datetime = timezone.make_aware(
                    datetime.combine(
                        end_date + timedelta(days=1),
                        time.min,
                    )
                )

                queryset = queryset.filter(
                    created_at__lt=end_datetime
                )
            except ValueError:
                pass

        return queryset


class TransactionExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(
            user=request.user
        ).order_by(
            "-created_at"
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response[
            "Content-Disposition"
        ] = (
            'attachment; filename="transactions.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "Transaction ID",
                "Amount",
                "Currency",
                "Payment Method",
                "Status",
                "Description",
                "Created At",
            ]
        )

        for transaction in transactions:
            writer.writerow(
                [
                    transaction.transaction_id,
                    transaction.amount,
                    transaction.currency,
                    transaction.payment_method,
                    transaction.status,
                    transaction.description,
                    transaction.created_at,
                ]
            )

        return response