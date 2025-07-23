"""
URL configuration for Topluluk project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter

from communities import views as community_views
from communities.views import MyProfileView, Subscriptions

router = DefaultRouter()
router.register('profile', community_views.ProfileViewSet, basename='profile')
router.register('user', community_views.UserViewSet, basename='user')
router.register('community', community_views.CommunityViewSet, basename='community')
router.register('topic', community_views.TopicViewSet, basename='topic')
router.register('comment', community_views.CommentViewSet, basename='comment')
router.register('notification', community_views.NotificationViewSet, basename='notification')
router.register('ban', community_views.BanViewSet, basename='ban')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', include('stats.urls')),
    path('subscriptions/', Subscriptions.as_view(), name='subscriptions'),
    path('my_profile/', MyProfileView.as_view(), name='my_profile'),
    path('api/login/', community_views.LoginView.as_view(), name='login'),
    path('api/logout/', community_views.LogoutView.as_view(), name='logout'),
    path('api/token/refresh/', community_views.CookieTokenRefreshView.as_view(), name='token_refresh'),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)