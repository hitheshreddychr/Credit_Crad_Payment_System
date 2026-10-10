
import csv
from collections import Counter
from datetime import datetime, timedelta
from decimal import Decimal
from io import BytesIO

from django.db import connection
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone

from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet

from admin_logs.services import create_admin_log
from cards.models import Card
from transactions.models import Transaction
from users.permissions import IsReadOnly, IsSystemAdmin


def client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    return forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")


def date_range(request):
    today = timezone.localdate()
    start_value = request.query_params.get("start_date")
    end_value = request.query_params.get("end_date")

    try:
        start = (
            datetime.strptime(start_value, "%Y-%m-%d").date()
            if start_value else today.replace(day=1)
        )
        end = (
            datetime.strptime(end_value, "%Y-%m-%d").date()
            if end_value else today
        )
    except ValueError:
        raise ValidationError({"date": "Use YYYY-MM-DD for start_date and end_date."})

    if start > end:
        raise ValidationError({"date": "start_date must not be after end_date."})

    return start, end


def filtered_transactions(request):
    start, end = date_range(request)
    queryset = Transaction.objects.filter(
        created_at__date__gte=start,
        created_at__date__lte=end,
    ).select_related("user", "card")

    status = request.query_params.get("status")
    if status:
        status = status.upper()
        if status not in dict(Transaction.STATUS_CHOICES):
            raise ValidationError({"status": "Use PENDING, SUCCESS, or FAILED."})
        queryset = queryset.filter(status=status)

    min_amount = request.query_params.get("min_amount")
    max_amount = request.query_params.get("max_amount")

    try:
        if min_amount not in (None, ""):
            value = Decimal(min_amount)
            if not value.is_finite() or value < 0:
                raise ValueError
            queryset = queryset.filter(amount__gte=value)

        if max_amount not in (None, ""):
            value = Decimal(max_amount)
            if not value.is_finite() or value < 0:
                raise ValueError
            queryset = queryset.filter(amount__lte=value)
    except (ValueError, ArithmeticError):
        raise ValidationError({"amount": "Amounts must be finite, non-negative numbers."})

    card_number = request.query_params.get("card_number")
    if card_number:
        digits = "".join(character for character in card_number if character.isdigit())
        if not digits:
            raise ValidationError({"card_number": "Enter a valid card suffix."})
        queryset = queryset.filter(card__last_four_digits__endswith=digits[-4:])

    return queryset, start, end


def expense_category(transaction):
    description = (transaction.description or "").lower()

    categories = {
        "Food & Dining": ("food", "restaurant", "cafe", "grocery", "dining"),
        "Shopping": ("shopping", "store", "clothing", "fashion", "purchase"),
        "Travel": ("travel", "flight", "hotel", "taxi", "uber", "fuel"),
        "Bills & Utilities": ("bill", "utility", "electricity", "internet", "recharge"),
        "Entertainment": ("movie", "entertainment", "game", "subscription"),
        "Healthcare": ("medical", "hospital", "pharmacy", "health"),
    }

    for category, keywords in categories.items():
        if any(keyword in description for keyword in keywords):
            return category

    return "Other"


class AdminAnalyticsView(APIView):
    permission_classes = [IsReadOnly]

    def get(self, request):
        queryset, start, end = filtered_transactions(request)
        successful = queryset.filter(status="SUCCESS")

        monthly = (
            successful
            .extra(select={"month": "DATE_FORMAT(created_at, '%%Y-%%m')"})
            .values("month")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("month")
        )

        categories = Counter()
        category_totals = Counter()

        for transaction in successful.iterator(chunk_size=500):
            category = expense_category(transaction)
            categories[category] += 1
            category_totals[category] += transaction.amount

        total_spending = successful.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        cards = Card.objects.filter(is_active=True, card_category="CREDIT")
        credit_limit = cards.aggregate(total=Sum("credit_limit"))["total"] or Decimal("0.00")

        successful_amount_by_card = (
            successful.filter(card__isnull=False)
            .values("card_id")
            .annotate(total=Sum("amount"))
        )
        spent_by_card = sum(
            (item["total"] or Decimal("0.00") for item in successful_amount_by_card),
            Decimal("0.00"),
        )
        utilization = (
            float((spent_by_card / credit_limit) * 100)
            if credit_limit > 0 else 0
        )

        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description=f"Viewed analytics from {start} to {end}.",
            ip_address=client_ip(request),
        )

        return Response({
            "start_date": str(start),
            "end_date": str(end),
            "total_spending": str(total_spending),
            "successful_transactions": successful.count(),
            "failed_transactions": queryset.filter(status="FAILED").count(),
            "pending_transactions": queryset.filter(status="PENDING").count(),
            "credit_limit_total": str(credit_limit),
            "credit_utilization_percent": round(utilization, 2),
            "monthly_spending": [
                {
                    "month": item["month"],
                    "amount": str(item["total"] or Decimal("0.00")),
                    "transactions": item["count"],
                }
                for item in monthly
            ],
            "category_spending": [
                {
                    "category": category,
                    "amount": str(category_totals[category]),
                    "transactions": categories[category],
                }
                for category in sorted(category_totals)
            ],
        })


class AdminAnalyticsCSVExportView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        queryset, start, end = filtered_transactions(request)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="credit_card_analytics.csv"'
        )

        writer = csv.writer(response)
        writer.writerow([
            "Transaction ID", "Username", "Amount", "Currency",
            "Status", "Category", "Masked Card", "Created At",
            "Suspicious", "Fraud Reason",
        ])

        for transaction in queryset.order_by("-created_at").iterator(chunk_size=500):
            writer.writerow([
                transaction.transaction_id,
                transaction.user.username,
                transaction.amount,
                transaction.currency,
                transaction.status,
                expense_category(transaction),
                transaction.card.masked_card_number if transaction.card else "",
                transaction.created_at,
                transaction.is_suspicious,
                transaction.fraud_reason,
            ])

        create_admin_log(
            admin=request.user,
            action="EXPORT_TRANSACTION",
            description=f"Exported analytics CSV from {start} to {end}.",
            ip_address=client_ip(request),
        )
        return response


class AdminAnalyticsPDFExportView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        queryset, start, end = filtered_transactions(request)
        successful = queryset.filter(status="SUCCESS")

        total = successful.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        buffer = BytesIO()
        styles = getSampleStyleSheet()
        document = SimpleDocTemplate(buffer, pagesize=A4)

        rows = [["Transaction ID", "Username", "Amount", "Status", "Category"]]
        for transaction in queryset.order_by("-created_at")[:500]:
            rows.append([
                transaction.transaction_id,
                transaction.user.username,
                f"{transaction.currency} {transaction.amount}",
                transaction.status,
                expense_category(transaction),
            ])

        table = Table(rows, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))

        document.build([
            Paragraph("Credit Card Analytics Report", styles["Title"]),
            Spacer(1, 12),
            Paragraph(f"Period: {start} to {end}", styles["Normal"]),
            Paragraph(f"Successful spending: INR {total}", styles["Normal"]),
            Paragraph("Maximum 500 matching transactions are included.", styles["Normal"]),
            Spacer(1, 12),
            table,
        ])

        buffer.seek(0)
        create_admin_log(
            admin=request.user,
            action="EXPORT_TRANSACTION",
            description=f"Exported analytics PDF from {start} to {end}.",
            ip_address=client_ip(request),
        )

        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="credit_card_analytics.pdf"'
        return response


class AdminSystemHealthView(APIView):
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        database_status = "healthy"
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            database_status = "unavailable"

        now = timezone.now()
        recent_start = now - timedelta(hours=24)

        recent = Transaction.objects.filter(created_at__gte=recent_start)

        result = {
            "status": "healthy" if database_status == "healthy" else "degraded",
            "checked_at": now.isoformat(),
            "database": database_status,
            "transactions_last_24_hours": recent.count(),
            "failed_transactions_last_24_hours": recent.filter(status="FAILED").count(),
            "suspicious_transactions_last_24_hours": recent.filter(is_suspicious=True).count(),
            "admin_logs_last_24_hours": None,
        }

        try:
            from admin_logs.models import AdminLog
            result["admin_logs_last_24_hours"] = AdminLog.objects.filter(
                created_at__gte=recent_start
            ).count()
        except Exception:
            result["admin_logs_last_24_hours"] = "unavailable"

        create_admin_log(
            admin=request.user,
            action="OTHER",
            description="Viewed system health dashboard.",
            ip_address=client_ip(request),
        )

        return Response(result)
