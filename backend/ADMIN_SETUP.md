# Admin User Setup

## Quick Admin User Creation

I've created tools to easily create admin users for your Spinny application.

### Default Admin Credentials

**Email:** `admin@spinny.com`  
**Password:** `admin123`  
**Role:** `super_admin`

### Method 1: Run the Standalone Script (Recommended)

Navigate to the backend directory and run:

```bash
cd backend
python create_admin_user.py
```

### Method 2: Use Django Management Command

```bash
cd backend
python manage.py create_admin

# Or with custom details:
python manage.py create_admin --name "Custom Admin" --email "custom@admin.com" --password "mypassword"
```

### Method 3: Using Django Shell

```bash
cd backend
python manage.py shell
```

Then in the shell:
```python
from authentication.models import AdminUser

# Create admin user
admin = AdminUser.objects.create(
    name='System Admin',
    email='admin@spinny.com',
    password_hash='admin123',
    role='super_admin',
    permissions=['manage_listings', 'manage_users', 'view_analytics', 'manage_reviews', 'system_settings'],
    is_active=True
)

print(f"Created admin: {admin.name} ({admin.email})")
```

## Access Admin Panel

1. **Start your servers:**
   ```bash
   # Frontend (from project root)
   npm run dev

   # Backend (from backend directory)  
   python manage.py runserver
   ```

2. **Visit:** http://localhost:3000/admin/login

3. **Login with:**
   - Email: `admin@spinny.com`
   - Password: `admin123`

## Admin Roles

- **super_admin**: Full access to all features
- **admin**: Limited admin access
- **moderator**: Content moderation only

## Security Note

⚠️ **Important:** The current implementation stores passwords as plain text for development purposes. In production, implement proper password hashing using Django's authentication system or bcrypt.

## Troubleshooting

If you get permission errors:
```bash
chmod +x backend/create_admin_user.py
```

If Django complains about missing modules, ensure you're in the correct directory and have activated your virtual environment. 