"""
URL configuration for TaskFlow project.

Django 6.0 Tutorial - CrashBytes
https://crashbytes.com/articles/django-6-getting-started-tutorial-2026-beginners-guide
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('tasks/', include('tasks.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', RedirectView.as_view(url='/tasks/', permanent=False)),
]
