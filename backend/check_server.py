#!/usr/bin/env python
"""
Django server diagnostic script
Run this from the backend directory: python check_server.py
"""
import os
import sys
import django
import subprocess
import socket

def check_port(port):
    """Check if port is available"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def main():
    print("🔍 Django Server Diagnostics")
    print("=" * 50)
    
    # Check if Django can be imported
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spinny_api.settings')
        django.setup()
        print("✅ Django setup successful")
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        return
    
    # Check database
    try:
        from django.db import connection
        connection.ensure_connection()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Try running: python manage.py migrate")
    
    # Check if port 8000 is in use
    if check_port(8000):
        print("⚠️  Port 8000 is already in use")
        print("💡 Either another Django server is running, or use a different port")
    else:
        print("✅ Port 8000 is available")
    
    # Check requirements
    try:
        import rest_framework
        import corsheaders
        print("✅ Required packages installed")
    except ImportError as e:
        print(f"❌ Missing packages: {e}")
        print("💡 Try running: pip install -r requirements.txt")
    
    print("\n📋 Next Steps:")
    print("1. If all checks pass, run: python manage.py runserver 8000")
    print("2. Visit: http://localhost:8000/api/v1/ to test")
    print("3. Your frontend should then work at: http://localhost:3001")

if __name__ == '__main__':
    main() 