from email.policy import default
from http.client import responses

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import permissions, generics, mixins, views, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from communities.models import Profile
from communities.permissions import IsOwnerOrReadonly, IsOwnerOrReadonlyForUser, DoesUserDontHaveProfile, \
    IsNotAuthenticated
from communities.serializers import ProfileSerializer, UserSerializer, UserRegisterSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    @action(detail=False, methods=['get'])
    def am_i_authenticated(self, request):
        return Response({'is_authenticated': request.user.is_authenticated})

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserRegisterSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAuthenticatedOrReadOnly()]
        if self.action == 'create':
            return [IsNotAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly(), IsOwnerOrReadonlyForUser()]

    def perform_create(self, serializer):
        # while creating the User object it
        # needs to create Profile object at the same time
        user = serializer.save()
        Profile.objects.create(user=user)

class LoginView(views.APIView):
    # login view that works with cookies
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data['username']
        password = request.data['password']
        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            response = Response({'message': 'login successful'})
            response.set_cookie('access', str(refresh.access_token), httponly=True, samesite='Lax',
                                max_age=10)
            response.set_cookie('refresh', str(refresh), httponly=True, samesite='Lax', max_age=60*60*24)
            return response
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    # logout view that works with cookies
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')

        if not refresh_token:
            return Response({'error': 'refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        response = Response({'message': 'logged out'}, status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response

class CookieTokenRefreshView(views.APIView):
    # refreshes the access token using the cookies refresh token
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')

        if not refresh_token:
            return Response({'error': 'refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
        except TokenError:
            return Response({'error': 'invalid token'}, status=status.HTTP_400_BAD_REQUEST)

        response = Response({'message': 'token refreshed'}, status=status.HTTP_200_OK)
        response.set_cookie('access', access_token, httponly=True, samesite='Lax')
        return response


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    lookup_field = 'slug'

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = Profile.objects.get(user=request.user)
        serializer = self.get_serializer(profile)
        return Response({'profile': serializer.data }, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticatedOrReadOnly(), DoesUserDontHaveProfile()]
        elif self.action in ['update', 'partial_update', 'destroy', 'me']:
            return [permissions.IsAuthenticatedOrReadOnly(), IsOwnerOrReadonly()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
