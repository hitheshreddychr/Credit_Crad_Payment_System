from calendar import monthrange
from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from transactions.models import Transaction


FONT_PATH = Path(settings.BASE_DIR) / "fonts" / "DejaVuSans.ttf"
FONT_BOLD_PATH = Path(settings.BASE_DIR) / "fonts" / "DejaVuSans-Bold.ttf"

pdfmetrics.registerFont(
    TTFont("DejaVuSans", str(FONT_PATH))
)

pdfmetrics.registerFont(
    TTFont("DejaVuSans-Bold", str(FONT_BOLD_PATH))
)


class MonthlyStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()

        try:
            year = int(
                request.query_params.get(
                    "year",
                    today.year,
                )
            )
            month = int(
                request.query_params.get(
                    "month",
                    today.month,
                )
            )
        except ValueError:
            return Response(
                {"detail": "Year and month must be numbers."},
                status=400,
            )

        if month < 1 or month > 12:
            return Response(
                {"detail": "Invalid month."},
                status=400,
            )

        start_date = date(year, month, 1)
        end_date = date(
            year,
            month,
            monthrange(year, month)[1],
        )

        transactions = (
            Transaction.objects.filter(
                user=request.user,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
            )
            .select_related("card")
            .order_by("created_at")
        )

        total_spending = sum(
            (
                transaction.amount
                for transaction in transactions
                if transaction.status == "SUCCESS"
            ),
            Decimal("0"),
        )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        title_style = ParagraphStyle(
            "StatementTitle",
            fontName="DejaVuSans-Bold",
            fontSize=20,
            leading=24,
        )

        normal_style = ParagraphStyle(
            "StatementNormal",
            fontName="DejaVuSans",
            fontSize=10,
            leading=14,
        )

        heading_style = ParagraphStyle(
            "StatementHeading",
            fontName="DejaVuSans-Bold",
            fontSize=14,
            leading=18,
        )

        elements = [
            Paragraph(
                "Credit Card Monthly Statement",
                title_style,
            ),
            Spacer(1, 12),
            Paragraph(
                f"Customer: {request.user.username}",
                normal_style,
            ),
            Paragraph(
                f"Period: {start_date.strftime('%d-%m-%Y')} "
                f"to {end_date.strftime('%d-%m-%Y')}",
                normal_style,
            ),
            Spacer(1, 15),
        ]

        rows = [
            [
                "Date",
                "Transaction ID",
                "Card",
                "Amount",
                "Status",
            ]
        ]

        for transaction in transactions:
            card_number = (
                f"**** {transaction.card.last_four_digits}"
                if transaction.card
                else "N/A"
            )

            rows.append(
                [
                    transaction.created_at.strftime(
                        "%d-%m-%Y"
                    ),
                    str(transaction.transaction_id),
                    card_number,
                    f"₹{transaction.amount}",
                    transaction.status,
                ]
            )

        if len(rows) == 1:
            rows.append(
                [
                    "-",
                    "No transactions",
                    "-",
                    "₹0.00",
                    "-",
                ]
            )

        table = Table(
            rows,
            repeatRows=1,
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#1f2937"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "DejaVuSans-Bold",
                    ),
                    (
                        "FONTNAME",
                        (0, 1),
                        (-1, -1),
                        "DejaVuSans",
                    ),
                    (
                        "ALIGN",
                        (3, 1),
                        (3, -1),
                        "RIGHT",
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, 0),
                        8,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, 0),
                        8,
                    ),
                ]
            )
        )

        elements.append(table)
        elements.append(Spacer(1, 20))

        elements.append(
            Paragraph(
                f"<b>Total Spending:</b> ₹{total_spending}",
                heading_style,
            )
        )

        document.build(elements)

        buffer.seek(0)

        filename = (
            f"monthly_statement_{year}_{month:02d}.pdf"
        )

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )