import csv

from datetime import datetime, time, timedelta
from decimal import Decimal, InvalidOperation

from django.db import models
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_logs.services import create_admin_log
from users.permissions import IsReadOnly, IsSystemAdmin

from .models import Transaction
from .serializers import TransactionSerializer


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def parse_amount(value, parameter_name):
    if value in (None, ""):
        return None

    try:
        amount = Decimal(value)
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(
            {parameter_name: "Enter a valid amount."}
        )

    if not amount.is_finite() or amount < 0:
        raise ValidationError(
            {parameter_name: "Amount must be a finite, non-negative number."}
        )

    return amount


def parse_filter_date(value, parameter_name, end_of_day=False):
    if not value:
        return None

    parsed_datetime = parse_datetime(value)

    if parsed_datetime is not None:
        if timezone.is_naive(parsed_datetime):
            parsed_datetime = timezone.make_aware(parsed_datetime)
        return parsed_datetime

    parsed_date = parse_date(value)

    if parsed_date is None:
        raise ValidationError(
            {
                parameter_name:
                    "Use YYYY-MM-DD or an ISO 8601 datetime."
            }
        )

    parsed_time = time.max if end_of_day else time.min

    return timezone.make_aware(
        datetime.combine(parsed_date, parsed_time)
    )


class AdminTransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminPaymentSummaryView(APIView):
    permission_classes = [IsReadOnly]

    def get(self, request):
        today = timezone.localdate()

        start_of_day = timezone.make_aware(
            datetime.combine(today, time.min)
        )

        start_of_next_day = start_of_day + timedelta(days=1)

        transactions = Transaction.objects.filter(
            created_at__gte=start_of_day,
            created_at__lt=start_of_next_day,
        )

        summary = transactions.aggregate(
            total_transactions=Count("id"),
            successful_payments=Count(
                "id",
                filter=models.Q(status="SUCCESS"),
            ),
            failed_payments=Count(
                "id",
                filter=models.Q(status="FAILED"),
            ),
            pending_payments=Count(
                "id",
                filter=models.Q(status="PENDING"),
            ),
            total_successful_amount=Sum(
                "amount",
                filter=models.Q(status="SUCCESS"),
            ),
        )

        total_successful_amount = (
            summary["total_successful_amount"]
            or Decimal("0.00")
        )

        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description="User viewed today's payment summary.",
            ip_address=get_client_ip(request),
        )

        return Response(
            {
                "date": str(today),
                "total_transactions": summary["total_transactions"] or 0,
                "successful_payments": summary["successful_payments"] or 0,
                "failed_payments": summary["failed_payments"] or 0,
                "pending_payments": summary["pending_payments"] or 0,
                "total_successful_amount": str(total_successful_amount),
            }
        )


class AdminTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsReadOnly]
    pagination_class = AdminTransactionPagination

    allowed_ordering_fields = {
        "created_at",
        "updated_at",
        "amount",
        "status",
        "transaction_id",
    }

    def get_queryset(self):
        queryset = Transaction.objects.select_related(
            "user",
            "card",
        ).all()

        params = self.request.query_params

        start_date = parse_filter_date(
            params.get("start_date"),
            "start_date",
        )

        end_date = parse_filter_date(
            params.get("end_date"),
            "end_date",
            end_of_day=True,
        )

        if start_date and end_date and start_date > end_date:
            raise ValidationError(
                {"date": "start_date must not be after end_date."}
            )

        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)

        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        min_amount = parse_amount(
            params.get("min_amount"),
            "min_amount",
        )

        max_amount = parse_amount(
            params.get("max_amount"),
            "max_amount",
        )

        if (
            min_amount is not None
            and max_amount is not None
            and min_amount > max_amount
        ):
            raise ValidationError(
                {"amount": "min_amount must not exceed max_amount."}
            )

        if min_amount is not None:
            queryset = queryset.filter(amount__gte=min_amount)

        if max_amount is not None:
            queryset = queryset.filter(amount__lte=max_amount)

        status = params.get("status")

        if status:
            status = status.upper()

            if status not in dict(Transaction.STATUS_CHOICES):
                raise ValidationError(
                    {"status": "Use PENDING, SUCCESS, or FAILED."}
                )

            queryset = queryset.filter(status=status)

        card_number = params.get("card_number")

        if card_number:
            digits = "".join(
                character
                for character in card_number
                if character.isdigit()
            )

            if not digits:
                raise ValidationError(
                    {"card_number": "Enter a valid card number or suffix."}
                )

            queryset = queryset.filter(
                card__last_four_digits__endswith=digits[-4:]
            )

        transaction_id = params.get("transaction_id")

        if transaction_id:
            queryset = queryset.filter(
                transaction_id__icontains=transaction_id.strip()
            )

        suspicious = params.get("is_suspicious")

        if suspicious is not None:
            normalized = suspicious.lower()

            if normalized not in ("true", "false", "1", "0"):
                raise ValidationError(
                    {"is_suspicious": "Use true or false."}
                )

            queryset = queryset.filter(
                is_suspicious=normalized in ("true", "1")
            )

        ordering = params.get("ordering", "-created_at")
        descending = ordering.startswith("-")
        ordering_field = ordering[1:] if descending else ordering

        if ordering_field not in self.allowed_ordering_fields:
            raise ValidationError(
                {
                    "ordering":
                        "Use created_at, updated_at, amount, status, "
                        "or transaction_id. Prefix with - for descending."
                }
            )

        ordering_expression = (
            f"-{ordering_field}" if descending else ordering_field
        )

        return queryset.order_by(ordering_expression, "-pk")

    def list(self, request, *args, **kwargs):
        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description="User searched or viewed admin transactions.",
            ip_address=get_client_ip(request),
        )

        return super().list(request, *args, **kwargs)


class AdminTransactionExportView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        transactions = (
            Transaction.objects
            .select_related("user", "card")
            .order_by("-created_at")
        )

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="admin_transactions.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "Transaction ID",
                "Username",
                "Amount",
                "Currency",
                "Payment Method",
                "Status",
                "Description",
                "Card",
                "Created At",
                "Suspicious",
                "Fraud Reason",
            ]
        )

        for transaction in transactions.iterator(chunk_size=500):
            card = (
                transaction.card.masked_card_number
                if transaction.card
                else ""
            )

            writer.writerow(
                [
                    transaction.transaction_id,
                    transaction.user.username,
                    transaction.amount,
                    transaction.currency,
                    transaction.payment_method,
                    transaction.status,
                    transaction.description,
                    card,
                    transaction.created_at,
                    transaction.is_suspicious,
                    transaction.fraud_reason,
                ]
            )

        create_admin_log(
            admin=request.user,
            action="EXPORT_TRANSACTION",
            description="Admin exported all transactions to CSV.",
            ip_address=get_client_ip(request),
        )

        return response
