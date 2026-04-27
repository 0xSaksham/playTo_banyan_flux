import random
from celery import shared_task
from django.db import transaction
from .models import Payout, Merchant, Transaction

# @shared_task is commented out to avoid issues in environments without Celery setup.
def process_payouts():
    pending = Payout.objects.filter(status='PENDING')
    print(f"Processing {pending.count()} pending payouts...")

    for payout in pending:
        payout.status = 'PROCESSING'
        payout.save()

        outcome = random.random()

        if outcome < 0.7:
            payout.status = 'COMPLETED'
            payout.save()
            print(f"Payout {payout.id} completed successfully.")

        elif outcome < 0.9:
            # FAILURE (Need to return funds)
            with transaction.atomic():
                payout.status = 'FAILED'
                payout.save()

                # Refund merchant balance
                m = payout.merchant
                m.balance_paise += payout.amount_paise
                m.save()
                print(f"Payout {payout.id} failed. Refunded {payout.amount_paise} paise to merchant {m.id}.")

                # Create a reversing transaction entry
                Transaction.objects.create(
                    merchant=m,
                    payout=payout,
                    amount_paise=payout.amount_paise,
                    type='CREDIT'
                )
        else:
            # HANG (do nothing, it stays in PROCESSING)
            print(f"Payout {payout.id} is hanging.")
            pass
