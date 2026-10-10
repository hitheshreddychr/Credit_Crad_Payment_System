from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("SUPPORT", "Support"),
        ("READ_ONLY", "Read-Only"),
    ]

    email = models.EmailField(unique=True)

    phone_number = models.CharField(
        max_length=15,
        blank=True,
    )

    is_admin = models.BooleanField(default=False)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="READ_ONLY",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.is_admin or self.is_superuser:
            self.role = "ADMIN"
        elif self.is_staff and self.role == "READ_ONLY":
            self.role = "ADMIN"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.username