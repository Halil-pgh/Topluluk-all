from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import permissions, views, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from communities.models import Profile, Community, Topic, Moderator, Comment, TopicVote, CommentVote
from communities.permissions import IsOwnerOrReadonly, IsOwnerOrReadonlyForUser, DoesUserDontHaveProfile, \
    IsNotAuthenticated, IsModerator
from communities.serializers import ProfileSerializer, UserSerializer, UserRegisterSerializer, CommunitySerializer, \
    TopicSerializer, CommentSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    @action(detail=False, methods=['get'])
    def am_i_authenticated(self, request):
        if request.user.is_authenticated:
            stat = status.HTTP_200_OK
        else:
            stat = status.HTTP_401_UNAUTHORIZED
        return Response({'is_authenticated': request.user.is_authenticated}, status=stat)

    @action(detail=True, methods=['get'])
    def profile(self, request, pk):
        profile = self.get_object().profile
        serializer = ProfileSerializer(profile, context={ 'request': request })
        return Response({ 'profile': serializer.data })

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
                                max_age=5)
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

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticatedOrReadOnly(), DoesUserDontHaveProfile()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticatedOrReadOnly(), IsOwnerOrReadonly()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MyProfileView(RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadonly]

    def get_object(self):
        return Profile.objects.get(user=self.request.user)

class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    lookup_field = 'slug'

    @action(detail=True, methods=['get'])
    def topics(self, request, slug):
        community = self.get_object()
        serializer = TopicSerializer(community.topics(), many=True, context={'request': request})
        response = Response(serializer.data)
        return response

    def get_queryset(self):
        queryset_length = 5
        real_length = Community.objects.count()
        if real_length < 5:
            queryset_length = real_length
        return Community.objects.order_by('created_date')[:queryset_length]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModerator()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        community = serializer.save()
        Moderator.objects.create(user=self.request.user, community=community)

class Votable:
    vote_class = None
    vote_field_name = None

    def get_vote_class(self):
        return self.vote_class

    def get_vote_field_name(self):
        return self.vote_field_name

    @action(detail=True, methods=['post'])
    def up_vote(self, request, slug):
        obj = self.get_object()
        user = request.user
        vote_filter = {
            'user': user,
            self.get_vote_field_name(): obj
        }
        self.get_vote_class().objects.update_or_create(
            defaults={'value': 1},
            **vote_filter
        )
        return Response({'detail': 'Up voted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def down_vote(self, request, slug):
        obj = self.get_object()
        user = request.user
        vote_filter = {
            'user': user,
            self.get_vote_field_name(): obj
        }
        self.get_vote_class().objects.update_or_create(
            defaults={'value': -1},
            **vote_filter
        )
        return Response({'detail': 'Down voted'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def remove_vote(self, request, slug):
        obj = self.get_object()
        user = request.user
        vote_filter = {
            'user': user,
            self.get_vote_field_name(): obj
        }
        self.get_vote_class().objects.filter(**vote_filter).delete()
        return Response({'detail': 'Vote removed'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def my_vote(self, request, slug):
        obj = self.get_object()
        user = request.user
        try:
            vote_filter = {
                'user': user,
                self.get_vote_field_name(): obj
            }
            vote = self.get_vote_class().objects.get(**vote_filter)
            return Response({'value': vote.value}, status=status.HTTP_200_OK)
        except TopicVote.DoesNotExist:
            return Response({'value': 0}, status=status.HTTP_200_OK)


class TopicViewSet(viewsets.ModelViewSet, Votable):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    lookup_field = 'slug'

    vote_class = TopicVote
    vote_field_name = 'topic'

    def get_queryset(self):
        return Topic.objects.order_by('created_date')

    def get_permissions(self):
        if self.action == ['create', 'up_vote', 'down_vote', 'remove_vote', 'my_vote']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModerator()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CommentViewSet(viewsets.ModelViewSet, Votable):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    vote_class = CommentVote
    vote_field_name = 'comment'

    def get_permissions(self):
        if self.action == ['create', 'up_vote', 'down_vote', 'remove_vote', 'my_vote']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModerator()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
