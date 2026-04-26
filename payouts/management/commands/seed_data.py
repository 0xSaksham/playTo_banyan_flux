from django.core.management.base import BaseCommand
from payouts.models import Merchant

class Command(BaseCommand):
  help = 'Seed the database with test merchants'

  def handle(self, *args, **kwargs):
    Merchant.objects.all().delete()  # Clear existing data

    m1 = Merchant.objects.create(name='Agent One', balance_paise = 1000000)
    m2 = Merchant.objects.create(name='FreelancerTwo', balance_paise = 500000)

    self.stdout.write(self.style.SUCCESS(f'Successfully seeded {Merchant.objects.count()} merchants'))
