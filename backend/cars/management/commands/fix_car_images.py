import os
import shutil
from django.core.management.base import BaseCommand
from django.conf import settings
from cars.models import Car, CarImage


class Command(BaseCommand):
    help = 'Move car images from temp folder to proper car-specific folders'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Moving car images from temp to proper folders...')
        
        # Find all images in temp folder that are assigned to cars
        temp_images = CarImage.objects.filter(
            car__isnull=False,
            image__startswith='cars/temp/'
        )
        
        moved_count = 0
        
        for img in temp_images:
            try:
                car = img.car
                old_path = img.image.path
                old_name = os.path.basename(old_path)
                
                # New path structure: cars/{car_id}/images/{filename}
                new_folder = os.path.join(settings.MEDIA_ROOT, 'cars', str(car.id), 'images')
                new_path = os.path.join(new_folder, old_name)
                new_relative_path = f'cars/{car.id}/images/{old_name}'
                
                # Create directory if it doesn't exist
                os.makedirs(new_folder, exist_ok=True)
                
                # Move the file
                if os.path.exists(old_path):
                    shutil.move(old_path, new_path)
                    
                    # Update database record
                    img.image.name = new_relative_path
                    img.save()
                    
                    self.stdout.write(f'✅ Moved: {old_name} → cars/{car.id}/images/')
                    moved_count += 1
                else:
                    self.stdout.write(f'⚠️  File not found: {old_path}')
                    
            except Exception as e:
                self.stdout.write(f'❌ Error moving {img.image.name}: {str(e)}')
        
        # Clean up empty temp directories
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'cars', 'temp')
        if os.path.exists(temp_dir):
            try:
                # Remove empty directories
                for root, dirs, files in os.walk(temp_dir, topdown=False):
                    if not files and not dirs:
                        os.rmdir(root)
                        
                # Remove temp folder if empty
                if not os.listdir(temp_dir):
                    os.rmdir(temp_dir)
                    self.stdout.write('🧹 Cleaned up empty temp directory')
            except:
                pass
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Successfully moved {moved_count} images to proper folders!')
        )
        
        if moved_count > 0:
            self.stdout.write('💡 Images are now properly organized and should display correctly.') 