from django.conf import settings
from django.db import models


class AdminLog(models.Model):
    ACTION_CHOICES = [
        ("LOGIN", "Login"),
        ("LOGOUT", "Logout"),
        ("VIEW_TRANSACTION", "View Transaction"),
        ("EXPORT_TRANSACTION", "Export Transaction"),
        ("UPDATE_TRANSACTION", "Update Transaction"),
        ("UPDATE_USER", "Update User"),
        ("DELETE_CARD", "Delete Card"),
        ("OTHER", "Other"),
    ]

    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_logs",
    )

    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
    )

    description = models.TextField(
        blank=True,
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.created_at}"