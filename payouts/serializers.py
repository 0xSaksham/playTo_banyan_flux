from rest_framework import serializers
from .models import Payout

class PayoutListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = ['id', 'amount_paise', 'status', 'created_at']
