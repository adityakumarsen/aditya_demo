from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.notifications.views import NotificationViewSet, ScheduledNotificationViewSet

router = DefaultRouter()
router.register(r'admin/scheduled', ScheduledNotificationViewSet, basename='scheduled-notification')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
