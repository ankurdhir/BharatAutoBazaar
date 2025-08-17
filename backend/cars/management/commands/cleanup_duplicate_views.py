from django.core.management.base import BaseCommand
from django.db.models import Count
from cars.models import CarView


class Command(BaseCommand):
    help = 'Clean up duplicate CarView records that violate unique_together constraint'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Looking for duplicate CarView records...')
        
        # Find groups of duplicates based on the unique_together constraint
        duplicates = (CarView.objects
                     .values('car', 'user', 'ip_address')
                     .annotate(count=Count('id'))
                     .filter(count__gt=1))
        
        total_duplicates = duplicates.count()
        total_removed = 0
        
        if total_duplicates == 0:
            self.stdout.write(self.style.SUCCESS('✅ No duplicate CarView records found.'))
            return
        
        self.stdout.write(f'📋 Found {total_duplicates} groups of duplicate records.')
        
        for duplicate_group in duplicates:
            # Get all records in this duplicate group
            records = CarView.objects.filter(
                car_id=duplicate_group['car'],
                user_id=duplicate_group['user'],
                ip_address=duplicate_group['ip_address']
            ).order_by('viewed_at')
            
            # Keep the oldest record, delete the rest
            records_to_delete = records[1:]  # Skip the first (oldest) record
            count_to_delete = len(records_to_delete)
            
            if count_to_delete > 0:
                self.stdout.write(
                    f'🗑️  Removing {count_to_delete} duplicate records for car {duplicate_group["car"]}'
                )
                
                for record in records_to_delete:
                    record.delete()
                    total_removed += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Cleanup complete! Removed {total_removed} duplicate records.')
        )
        self.stdout.write('💡 You can now view car listings without errors.') 