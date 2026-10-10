
from django.urls import path

from .admin_views import (
    AdminPaymentSummaryView,
    AdminTransactionExportView,
    AdminTransactionListView,
)
from .assessment24_views import (
    AdminAnalyticsCSVExportView,
    AdminAnalyticsPDFExportView,
    AdminAnalyticsView,
    AdminSystemHealthView,
)
from .views import (
    PaymentProcessView,
    TransactionExportView,
    TransactionHistoryView,
)


urlpatterns = [
    path("process/", PaymentProcessView.as_view(), name="payment-process"),
    path("history/", TransactionHistoryView.as_view(), name="transaction-history"),
    path("export/", TransactionExportView.as_view(), name="transaction-export"),
    path("admin/summary/", AdminPaymentSummaryView.as_view(), name="admin-payment-summary"),
    path("admin/transactions/", AdminTransactionListView.as_view(), name="admin-transaction-list"),
    path("admin/transactions/export/", AdminTransactionExportView.as_view(), name="admin-transaction-export"),
    path("admin/analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("admin/analytics/export/csv/", AdminAnalyticsCSVExportView.as_view(), name="admin-analytics-export-csv"),
    path("admin/analytics/export/pdf/", AdminAnalyticsPDFExportView.as_view(), name="admin-analytics-export-pdf"),
    path("admin/system-health/", AdminSystemHealthView.as_view(), name="admin-system-health"),
]
