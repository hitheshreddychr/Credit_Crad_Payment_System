from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from cards.models import Card
from transactions.models import Transaction


User = get_user_model()


class Assessment24RBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="rbac_admin",
            email="rbac_admin@example.com",
            password="TestAdminPassword123!",
            is_admin=True,
            is_staff=True,
            is_superuser=True,
            role="ADMIN",
        )

        self.support = User.objects.create_user(
            username="rbac_support",
            email="rbac_support@example.com",
            password="TestSupportPassword123!",
            role="SUPPORT",
        )

        self.read_only = User.objects.create_user(
            username="rbac_readonly",
            email="rbac_readonly@example.com",
            password="TestReadOnlyPassword123!",
            role="READ_ONLY",
        )

        self.card = Card.objects.create(
            user=self.read_only,
            cardholder_name="RBAC Test User",
            card_type="VISA",
            card_category="CREDIT",
            credit_limit=Decimal("50000.00"),
            last_four_digits="1234",
            masked_card_number="************1234",
            expiry_month=12,
            expiry_year=2030,
            is_active=True,
        )

        self.transaction = Transaction.objects.create(
            user=self.read_only,
            card=self.card,
            transaction_id="RBAC-TEST-TXN-001",
            amount=Decimal("1500.00"),
            currency="INR",
            payment_method="CARD",
            status="SUCCESS",
            description="RBAC permission test",
        )

    def test_admin_can_view_users_and_cards(self):
        self.client.force_authenticate(user=self.admin)

        users_response = self.client.get("/api/admin/users/")
        cards_response = self.client.get("/api/admin/cards/")

        self.assertEqual(users_response.status_code, 200)
        self.assertEqual(cards_response.status_code, 200)

    def test_support_and_read_only_cannot_view_admin_user_list(self):
        for user in (self.support, self.read_only):
            with self.subTest(role=user.role):
                self.client.force_authenticate(user=user)
                response = self.client.get("/api/admin/users/")
                self.assertEqual(response.status_code, 403)

    def test_support_and_read_only_cannot_update_cards(self):
        for user in (self.support, self.read_only):
            with self.subTest(role=user.role):
                self.client.force_authenticate(user=user)

                response = self.client.patch(
                    f"/api/admin/cards/{self.card.id}/",
                    {"is_active": False},
                    format="json",
                )

                self.assertEqual(response.status_code, 403)

        self.card.refresh_from_db()
        self.assertTrue(self.card.is_active)

    def test_support_and_read_only_cannot_export_admin_transactions(self):
        for user in (self.support, self.read_only):
            with self.subTest(role=user.role):
                self.client.force_authenticate(user=user)

                response = self.client.get(
                    "/api/payments/admin/transactions/export/"
                )

                self.assertEqual(response.status_code, 403)

    def test_unauthenticated_users_cannot_access_admin_endpoints(self):
        self.client.force_authenticate(user=None)

        endpoints = [
            "/api/admin/users/",
            "/api/admin/cards/",
            "/api/payments/admin/summary/",
            "/api/payments/admin/transactions/",
            "/api/payments/admin/transactions/export/",
        ]

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertIn(response.status_code, (401, 403))

    def test_admin_can_update_card_and_create_audit_log(self):
        from admin_logs.models import AdminLog

        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/admin/cards/{self.card.id}/",
            {"is_active": False},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.card.refresh_from_db()
        self.assertFalse(self.card.is_active)

        self.assertTrue(
            AdminLog.objects.filter(
                admin=self.admin,
                action="BLOCK_CARD",
            ).exists()
        )

    def test_admin_can_export_transactions(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            "/api/payments/admin/transactions/export/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
