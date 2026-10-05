
import os
from decimal import Decimal
from unittest.mock import patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from cards.models import Card
from transactions.models import Transaction


User = get_user_model()


class PaymentAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="payment_test_user",
            email="payment_test@example.com",
            password="TestPass123!",
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.card = Card.objects.create(
            user=self.user,
            cardholder_name="Test User",
            card_type="VISA",
            card_category="CREDIT",
            last_four_digits="4242",
            masked_card_number="************4242",
            expiry_month=12,
            expiry_year=2030,
            is_active=True,
        )

    def test_transaction_history_returns_user_transactions(self):
        transaction = Transaction.objects.create(
            user=self.user,
            card=self.card,
            transaction_id="TXN-TEST-HISTORY",
            amount=Decimal("1500.00"),
            currency="INR",
            payment_method="CARD",
            status="SUCCESS",
            description="Test payment",
        )

        response = self.client.get("/api/payments/history/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, transaction.transaction_id)

    def test_payment_rejects_invalid_amount(self):
        response = self.client.post(
            "/api/payments/process/",
            {
                "card_id": self.card.id,
                "amount": "0",
                "currency": "INR",
                "description": "Invalid amount",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Transaction.objects.count(), 0)

    @patch("transactions.views.requests.post")
    def test_successful_payment(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "transaction_id": "TXN-TEST-SUCCESS",
            "status": "SUCCESS",
            "amount": "1500.00",
            "currency": "INR",
            "message": "Payment processed successfully.",
        }
        mock_post.return_value.raise_for_status.return_value = None

        response = self.client.post(
            "/api/payments/process/",
            {
                "card_id": self.card.id,
                "amount": "1500.00",
                "currency": "INR",
                "description": "Automated test payment",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["transaction"]["status"], "SUCCESS")
        self.assertTrue(
            Transaction.objects.filter(
                transaction_id="TXN-TEST-SUCCESS",
                status="SUCCESS",
            ).exists()
        )