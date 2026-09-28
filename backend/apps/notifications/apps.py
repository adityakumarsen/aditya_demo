import os
import sys
from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'System Notifications'

    def ready(self):
        # Start daemon scheduler when running dev server or WSGI/ASGI application
        is_manage_server = any(cmd in sys.argv for cmd in ['runserver', 'runserver_plus', 'gunicorn', 'uvicorn', 'daphne'])
        is_main_process = os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_AUTORELOAD_ENV')
        if is_manage_server and is_main_process:
            try:
                from apps.notifications.services import start_scheduler_thread
                start_scheduler_thread()
            except Exception:
                pass
