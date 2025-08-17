# Production Environment Setup

## Required Environment Variables

- SECRET_KEY
- DEBUG=false
- ALLOWED_HOSTS=api.example.com
- CORS_ALLOWED_ORIGINS=https://your-username.github.io,https://example.com
- SECURE_SSL_REDIRECT=true
- DATABASE_URL=postgres://user:pass@host:5432/dbname
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- USE_S3=false (or true with S3/GCS credentials)

## Gunicorn

Run gunicorn with the provided config:

```
cd backend
export DJANGO_SETTINGS_MODULE=spinny_api.settings
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn spinny_api.wsgi:application -c backend/gunicorn.conf.py
```

## Nginx

Use `backend/nginx.conf.example` as a starting point. Update paths:

- /opt/app/staticfiles/ → your STATIC_ROOT
- /opt/app/media/ → your MEDIA_ROOT (avoid local media in prod; use cloud storage)

Ensure nginx forwards X-Forwarded-Proto and enable SECURE_SSL_REDIRECT=true in env.
