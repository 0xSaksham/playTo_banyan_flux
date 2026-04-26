from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction, IntegrityError
from .models import Payout, Merchant
from .serializers import PayoutSerializer

class PayoutRequestView(APIView):
  def post(self, request):
    idempotency_key = request.headers.get('Idempotency-Key')
    if not idempotency_key:
      return Response({'error': 'Idempotency-Key header is required.'}, status=status.HTTP_400_BAD_REQUEST)

    serializar = PayoutSerializer(data=request.data)
    if not serializar.is_valid():
      return Response(serializar.errors, status=status.HTTP_400_BAD_REQUEST)

    amount = serializar.validated_data['amount_paise']

    # We are hardcoding the merchant for testing the app, in production we will get the merchant from the request (e.g. from the authenticated user)
    merchant = Merchant.objects.get(id = 1)

    # Check for existing payout with the same idempotency key and merchant
    existing_payout = Payout.objects.filter(idempotency_key=idempotency_key, merchant=merchant).first()
    if existing_payout:
      return Response({'message': 'Payout already processed.', 'payout_id': existing_payout.id}, status=status.HTTP_200_OK)

    # implementing the payout logic in a transaction to ensure atomicity
    try:
      with transaction.atomic():
        merchant = Merchant.objects.select_for_update().get(id=merchant.id)  # Prevents Race conditions

        if merchant.balance_paise < amount:
          return Response({'error': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)

        payout = Payout.objects.create(
          merchant=merchant,
          amount_paise=amount,
          idempotency_key=idempotency_key,
          status='pending'
        )

        merchant.balance_paise -= amount
        merchant.save()

        return Response({'message': 'Payout request successful.', 'payout_id': payout.id}, status=status.HTTP_201_CREATED)

    except IntegrityError:
      return Response({'error': 'A payout with this idempotency key already exists.'}, status=status.HTTP_409_CONFLICT)
