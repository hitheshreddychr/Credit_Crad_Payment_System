from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from admin_logs.models import AdminLog
from cards.models import Card
from transactions.fraud_detection import evaluate_transaction_fraud
from transactions.models import Transaction

User = get_user_model()


class Assessment24FraudDetectionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="fraud_test_user",
            email="fraud_test@example.com",
            password="TestPassword123!",
        )

        self.card = Card.objects.create(
            user=self.user,
            cardholder_name="Fraud Test User",
            card_type="VISA",
            card_category="CREDIT",
            credit_limit=Decimal("50000.00"),
            last_four_digits="5678",
            masked_card_number="************5678",
            expiry_month=12,
            expiry_year=2030,
            is_active=True,
        )

    def create_transaction(
        self,
        transaction_id,
        amount="1000.00",
        status="SUCCESS",
        created_at=None,
        ip_address=None,
        device_fingerprint="",
    ):
        transaction = Transaction.objects.create(
            user=self.user,
            card=self.card,
            transaction_id=transaction_id,
            amount=Decimal(amount),
            currency="INR",
            payment_method="CARD",
            status=status,
            description="Fraud detection test",
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
        )

        if created_at is not None:
            Transaction.objects.filter(
                pk=transaction.pk
            ).update(created_at=created_at)
            transaction.refresh_from_db()

        return transaction

    @patch("transactions.fraud_detection.send_notification_email")
    def test_three_high_value_transactions_trigger_fraud_alert(
        self, mock_email
    ):
        recent_time = timezone.now() - timedelta(minutes=2)

        self.create_transaction(
            "FRAUD-001",
            "6000.00",
            created_at=recent_time,
        )
        self.create_transaction(
            "FRAUD-002",
            "7000.00",
            created_at=recent_time,
        )
        current = self.create_transaction(
            "FRAUD-003",
            "8000.00",
            status="PENDING",
        )

        result = evaluate_transaction_fraud(
            current,
            ip_address="127.0.0.1",
        )

        self.assertTrue(result["is_suspicious"])
        self.assertIn(
            "Multiple high-value transactions within 10 minutes.",
            result["reasons"],
        )
        self.assertTrue(
            AdminLog.objects.filter(action="FRAUD_ALERT").exists()
        )
        mock_email.assert_called_once()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_single_high_value_transaction_does_not_trigger_alert(
        self, mock_email
    ):
        transaction = self.create_transaction(
            "NORMAL-001",
            "6000.00",
        )

        result = evaluate_transaction_fraud(transaction)

        self.assertFalse(result["is_suspicious"])
        self.assertEqual(result["reasons"], [])
        mock_email.assert_not_called()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_transactions_outside_window_do_not_trigger_alert(
        self, mock_email
    ):
        old_time = timezone.now() - timedelta(minutes=15)

        self.create_transaction(
            "OLD-001",
            "6000.00",
            created_at=old_time,
        )
        self.create_transaction(
            "OLD-002",
            "7000.00",
            created_at=old_time,
        )
        current = self.create_transaction(
            "CURRENT-001",
            "8000.00",
        )

        result = evaluate_transaction_fraud(current)

        self.assertFalse(result["is_suspicious"])
        self.assertEqual(result["reasons"], [])
        mock_email.assert_not_called()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_low_value_transactions_do_not_trigger_high_value_rule(
        self, mock_email
    ):
        self.create_transaction("LOW-001", "1000.00")
        self.create_transaction("LOW-002", "2000.00")
        current = self.create_transaction("LOW-003", "3000.00")

        result = evaluate_transaction_fraud(current)

        self.assertFalse(result["is_suspicious"])
        self.assertEqual(result["reasons"], [])
        mock_email.assert_not_called()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_fraud_alert_records_client_ip(self, mock_email):
        recent_time = timezone.now() - timedelta(minutes=1)

        self.create_transaction(
            "IP-001",
            "6000.00",
            created_at=recent_time,
        )
        self.create_transaction(
            "IP-002",
            "7000.00",
            created_at=recent_time,
        )
        current = self.create_transaction(
            "IP-003",
            "9000.00",
        )

        evaluate_transaction_fraud(
            current,
            ip_address="192.0.2.10",
        )

        log = AdminLog.objects.get(action="FRAUD_ALERT")
        self.assertEqual(log.ip_address, "192.0.2.10")
        mock_email.assert_called_once()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_different_ip_within_two_minutes_triggers_alert(
        self, mock_email
    ):
        recent_time = timezone.now() - timedelta(seconds=30)

        self.create_transaction(
            "DIFF-IP-001",
            ip_address="192.0.2.1",
            created_at=recent_time,
        )
        current = self.create_transaction(
            "DIFF-IP-002",
            ip_address="192.0.2.2",
        )

        result = evaluate_transaction_fraud(
            current,
            ip_address="192.0.2.2",
        )

        self.assertTrue(result["is_suspicious"])
        self.assertIn(
            "Rapid transactions from different IP addresses.",
            result["reasons"],
        )
        mock_email.assert_called_once()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_different_device_within_two_minutes_triggers_alert(
        self, mock_email
    ):
        recent_time = timezone.now() - timedelta(seconds=30)

        self.create_transaction(
            "DIFF-DEVICE-001",
            device_fingerprint="device-hash-one",
            created_at=recent_time,
        )
        current = self.create_transaction(
            "DIFF-DEVICE-002",
            device_fingerprint="device-hash-two",
        )

        result = evaluate_transaction_fraud(
            current,
            device_fingerprint="device-hash-two",
        )

        self.assertTrue(result["is_suspicious"])
        self.assertIn(
            "Rapid transactions from different devices.",
            result["reasons"],
        )
        mock_email.assert_called_once()

    @patch("transactions.fraud_detection.send_notification_email")
    def test_same_ip_and_device_do_not_trigger_rapid_activity_alert(
        self, mock_email
    ):
        recent_time = timezone.now() - timedelta(seconds=30)

        self.create_transaction(
            "SAME-DEVICE-001",
            ip_address="192.0.2.1",
            device_fingerprint="same-device",
            created_at=recent_time,
        )
        current = self.create_transaction(
            "SAME-DEVICE-002",
            ip_address="192.0.2.1",
            device_fingerprint="same-device",
        )

        result = evaluate_transaction_fraud(
            current,
            ip_address="192.0.2.1",
            device_fingerprint="same-device",
        )

        self.assertFalse(result["is_suspicious"])
        self.assertEqual(result["reasons"], [])
        mock_email.assert_not_called()
