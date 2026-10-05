import csv

from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db import models
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from admin_logs.services import create_admin_log

from .models import Transaction
from .serializers import TransactionSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_admin
                or request.user.is_staff
            )
        )


class AdminPaymentSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()

        start_of_day = timezone.make_aware(
            datetime.combine(
                today,
                time.min,
            )
        )

        start_of_next_day = start_of_day + timedelta(
            days=1
        )

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
            description=(
                "Admin viewed today's payment summary."
            ),
            ip_address=(
                request.META.get("REMOTE_ADDR")
            ),
        )

        return Response(
            {
                "date": str(today),
                "total_transactions": (
                    summary["total_transactions"] or 0
                ),
                "successful_payments": (
                    summary["successful_payments"] or 0
                ),
                "failed_payments": (
                    summary["failed_payments"] or 0
                ),
                "pending_payments": (
                    summary["pending_payments"] or 0
                ),
                "total_successful_amount": str(
                    total_successful_amount
                ),
            }
        )


class AdminTransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Transaction.objects.all().select_related(
            "user",
            "card",
        )

    def list(self, request, *args, **kwargs):
        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description="Admin viewed all transactions.",
            ip_address=(
                request.META.get("REMOTE_ADDR")
            ),
        )

        return super().list(
            request,
            *args,
            **kwargs,
        )


class AdminTransactionExportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        transactions = Transaction.objects.all().select_related(
            "user",
            "card",
        ).order_by(
            "-created_at"
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response[
            "Content-Disposition"
        ] = (
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
            ]
        )

        for transaction in transactions:
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
                ]
            )

        create_admin_log(
            admin=request.user,
            action="EXPORT_TRANSACTION",
            description=(
                "Admin exported all transactions to CSV."
            ),
            ip_address=(
                request.META.get("REMOTE_ADDR")
            ),
        )

        return response