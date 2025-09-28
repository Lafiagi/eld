"""
ASGI config for eld_backend project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eld_backend.settings')

application = get_asgi_application()
