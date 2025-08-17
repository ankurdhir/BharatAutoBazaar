"""
Django management command to create admin users
"""
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from authentication.models import AdminUser


class Command(BaseCommand):
    help = 'Create an admin user for the system'

    def add_arguments(self, parser):
        parser.add_argument('--name', type=str, help='Admin name', default='System Admin')
        parser.add_argument('--email', type=str, help='Admin email', default='admin@spinny.com')
        parser.add_argument('--password', type=str, help='Admin password', default='admin123')
        parser.add_argument('--role', type=str, choices=['admin', 'super_admin', 'moderator'], 
                          help='Admin role', default='super_admin')

    def handle(self, *args, **options):
        name = options['name']
        email = options['email']
        password = options['password']
        role = options['role']

        # Validate email
        try:
            validate_email(email)
        except ValidationError:
            self.stdout.write(
                self.style.ERROR(f'Invalid email address: {email}')
            )
            return

        # Check if admin already exists
        if AdminUser.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {email} already exists!')
            )
            return

        # Create admin user
        try:
            admin_user = AdminUser.objects.create(
                name=name,
                email=email,
                password_hash=password,  # Note: This is plain text for development
                role=role,
                permissions=[
                    'manage_listings',
                    'manage_users',
                    'view_analytics',
                    'manage_reviews',
                    'system_settings'
                ] if role == 'super_admin' else [
                    'manage_listings',
                    'view_analytics'
                ],
                is_active=True
            )

            self.stdout.write(
                self.style.SUCCESS(f'Successfully created admin user: {admin_user.name}')
            )
            self.stdout.write(f'Email: {admin_user.email}')
            self.stdout.write(f'Role: {admin_user.role}')
            self.stdout.write(f'Password: {password}')
            self.stdout.write(
                self.style.WARNING('⚠️  Note: Password is stored as plain text for development. Use proper hashing in production!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating admin user: {str(e)}')
            ) 