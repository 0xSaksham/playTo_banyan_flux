from django.core.management.base import BaseCommand
from django.core.management import call_command
import os

class Command(BaseCommand):
    help = 'Resets the database and seeds it'

    def handle(self, *args, **kwargs):
        if os.path.exists('db.sqlite3'):
            os.remove('db.sqlite3')
            self.stdout.write("Database file deleted.")

        call_command('migrate')

        call_command('seed_data')

        self.stdout.write(self.style.SUCCESS("Database reset and seeded successfully!"))
