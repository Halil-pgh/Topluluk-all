from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework import permissions, generics, mixins, views, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response

from communities.models import Profile
from communities.permissions import IsOwnerOrReadonly, IsOwnerOrReadonlyForUser, DoesUserDontHaveProfile, \
    IsNotAuthenticated
from communities.serializers import ProfileSerializer, UserSerializer, UserRegisterSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            response = Response({'login success': True}, status=status.HTTP_200_OK)
            response.set_cookie(
                'authToken',
                value=token.key,
                httponly=True,
                secure=True, # requests a https website
                samesite='Lax',
                max_age=60*60*24*7  # 1 week expiration
            )

            return response
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        request.user.auth_token.delete()
        response = Response({'logout success': True}, status=status.HTTP_200_OK)
        response.delete_cookie('authToken')
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

