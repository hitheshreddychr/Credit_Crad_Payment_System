from django.urls import path

from .admin_views import (
    AdminPaymentSummaryView,
    AdminTransactionExportView,
    AdminTransactionListView,
)
from .views import (
    PaymentProcessView,
    TransactionExportView,
    TransactionHistoryView,
)


urlpatterns = [
    path(
        "process/",
        PaymentProcessView.as_view(),
        name="payment-process",
    ),

    path(
        "history/",
        TransactionHistoryView.as_view(),
        name="transaction-history",
    ),

    path(
        "export/",
        TransactionExportView.as_view(),
        name="transaction-export",
    ),

    path(
        "admin/summary/",
        AdminPaymentSummaryView.as_view(),
        name="admin-payment-summary",
    ),

    path(
        "admin/transactions/",
        AdminTransactionListView.as_view(),
        name="admin-transaction-list",
    ),

    path(
        "admin/transactions/export/",
        AdminTransactionExportView.as_view(),
        name="admin-transaction-export",
    ),
]