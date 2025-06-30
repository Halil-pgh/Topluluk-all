from xml.etree.ElementInclude import include

from django.urls import path
from rest_framework.routers import DefaultRouter

from communities import views as community_views

app_name = 'communities'
urlpatterns = [
    path('user/', community_views.UserView.as_view(), name='user'),
    path('user/<int:pk>/', community_views.UserDetailView.as_view(), name='user-detail'),
]