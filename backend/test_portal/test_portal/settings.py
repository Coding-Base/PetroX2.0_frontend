import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
import os

GS_BUCKET_NAME =  'petrox-materials'
GS_PROJECT_ID = 'radiant-mason-462816-q3'
# 
# GCS_CREDENTIALS_PATH = 

GCS_CREDENTIALS_PATH = r'C:\Users\USER\Downloads\ninth-bonfire-399111-b8962690bc0b.json'
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GCS_CREDENTIALS_PATH
GOOGLE_APPLICATION_CREDENTIALS = GCS_CREDENTIALS_PATH

DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
MEDIA_URL = f'https://storage.googleapis.com/{GS_BUCKET_NAME}/'

GS_DEFAULT_ACL = None
# GOOGLE_APPLICATION_CREDENTIALS = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
# GS_BUCKET_NAME = os.environ.get('petrox-materials')
# DEFAULT_FILE_STORAGE = 'db.sqlite3.GoogleCloudMediaStorage'
# MEDIA_URL = f'https://storage.googleapis.com/{GS_BUCKET_NAME}/media/'
# # Load .env
load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = os.getenv('SECRET_KEY', 'unsafe-default-for-dev')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'storages',
    'exams',
]
# Google Cloud Storage
# DEFAULT_FILE_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'
# GS_BUCKET_NAME = os.getenv('GS_BUCKET_NAME')

# GS_PROJECT_ID = os.getenv('GS_PROJECT_ID')  # Replace with your GCP project ID

# Path to your service account key file
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(BASE_DIR, 'path/to/service-account.json')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'test_portal.urls'

# Fixed TEMPLATES configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            BASE_DIR / 'test_portal' / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'test_portal.wsgi.application'
ASGI_APPLICATION = 'test_portal.asgi.application'

#
# Database
#
if DEBUG:
    # During development, use simple SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # In production, parse your DATABASE_URL (Render, Heroku, etc.)
    DATABASES = {
        'default': dj_database_url.config(
            default=os.getenv('DATABASE_URL'),
            conn_max_age=600,
            ssl_require=True
        )
    }

#
# REST Framework & JWT
#
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

#
# CORS
#
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

#
# Static files
#
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

#
# Channels
#
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

#
# Internationalization
#
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

#
# Email Configuration
#
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 465
EMAIL_USE_TLS = False
EMAIL_USE_SSL = True
EMAIL_HOST_USER = 'thecbsteam8@gmail.com'
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD' ) # CHANGE THIS IMMEDIATELY!
DEFAULT_FROM_EMAIL = 'Petrox Assessment <thecbsteam8@gmail.com>'

# Frontend domain for email links
FRONTEND_DOMAIN = 'http://localhost:3000'  # Change in production

# Security enhancements for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}