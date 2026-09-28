from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API Endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('auth/', include('apps.accounts.urls')),
    path('api/organization/', include('apps.organization.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('api/goals/', include('apps.goals.urls')),
    path('api/evidence/', include('apps.evidence.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('feedback/', include('apps.feedback.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/training/', include('apps.training.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('reports/', include('apps.reports.urls')),
    path('api/audit/', include('apps.audit.urls')),

    # Persona-Dedicated Endpoints
    path('api/superadmin/', include('apps.superadmin.urls')),
    path('api/hr/', include('apps.hr.urls')),
    path('api/manager/', include('apps.manager.urls')),
    path('api/v1/manager/', include('apps.manager.urls')),
    path('api/intern/', include('apps.intern.urls')),
    path('api/v1/intern/', include('apps.intern.urls')),
    path('intern/', include('apps.intern.urls')),

    # Frontend Compatibility Endpoints (Dashboards, Departments, Employees, Appraisals)
    path('api/', include('apps.frontend_compat.urls')),
    path('api/v1/', include('apps.frontend_compat.urls')),
    path('', include('apps.frontend_compat.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
