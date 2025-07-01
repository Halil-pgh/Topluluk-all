from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import permissions, generics, mixins, views, status, viewsets
from rest_framework.authtoken.models import Token
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
            login(request, user)
            return Response(status=status.HTTP_200_OK)
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticatedOrReadOnly(), DoesUserDontHaveProfile()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticatedOrReadOnly(), IsOwnerOrReadonly()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
