from django.db import models

class Merchant(models.Model):
    name = models.CharField(max_length=255)
    balance_paise = models.BigIntegerField(default=0)

    def __str__(self):
        return self.name

class Payout(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='payouts')
    amount_paise = models.BigIntegerField()
    idempotency_key = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('idempotency_key', 'merchant')

    def __str__(self):
        return f'Payout {self.id} for {self.merchant.name} - {self.amount_paise} paise'
