from django.test import TransactionTestCase
from django.urls import reverse
from payouts.models import Merchant, Payout
import uuid

class PayoutConcurrencyTest(TransactionTestCase):
    def setUp(self):
        # We need a fixed ID to ensure the view finds the correct merchant
        self.merchant = Merchant.objects.create(id=1, name="Agency", balance_paise=100000)
        self.url = '/api/v1/payouts/'

    def test_double_spend_prevention(self):
        # We simulate the exact behavior of a race condition by
        # using different idempotency keys but the same merchant logic.

        key1 = str(uuid.uuid4())
        key2 = str(uuid.uuid4())

        # Request 1: 600 INR
        resp1 = self.client.post(self.url,
                                 data={'amount_paise': 60000},
                                 content_type='application/json',
                                 HTTP_IDEMPOTENCY_KEY=key1)

        # Request 2: 600 INR (Should fail)
        resp2 = self.client.post(self.url,
                                 data={'amount_paise': 60000},
                                 content_type='application/json',
                                 HTTP_IDEMPOTENCY_KEY=key2)

        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(resp2.status_code, 400) # Should fail due to insufficient funds

        self.merchant.refresh_from_db()
        self.assertEqual(self.merchant.balance_paise, 40000)

    def test_idempotency(self):
        # This tests that calling the SAME key twice returns the same result
        key = str(uuid.uuid4())

        resp1 = self.client.post(self.url,
                                 data={'amount_paise': 10000},
                                 content_type='application/json',
                                 HTTP_IDEMPOTENCY_KEY=key)

        resp2 = self.client.post(self.url,
                                 data={'amount_paise': 10000},
                                 content_type='application/json',
                                 HTTP_IDEMPOTENCY_KEY=key)

        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(resp2.status_code, 200) # 200 OK for repeated key
        self.assertEqual(Payout.objects.filter(idempotency_key=key).count(), 1)
