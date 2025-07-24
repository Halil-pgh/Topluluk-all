import datetime

from asgiref.sync import async_to_sync
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.serializers import serialize
from django.db.models import Q, Count, ExpressionWrapper, F
from django.db.models.fields import IntegerField
from django.utils import timezone
from rest_framework import permissions, views, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveUpdateAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from channels.layers import get_channel_layer

from communities.models import Profile, Community, Topic, Moderator, Comment, TopicVote, CommentVote, Subscriber, \
    Notification, Ban, TopicClick, CommunityClick
from communities.permissions import IsOwnerOrReadonly, IsOwnerOrReadonlyForUser, DoesUserDontHaveProfile, \
    IsNotAuthenticated, IsModerator, IsModeratorOfTopic, IsModeratorOfBan, \
    IsNotBannedFromCommunity, IsModeratorOfComment
from communities.serializers import ProfileSerializer, UserSerializer, UserRegisterSerializer, CommunitySerializer, \
    TopicSerializer, CommentSerializer, NotificationSerializer, BanSerializer


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
                                max_age=5*60)
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

class BanManager:
    @staticmethod
    def is_user_banned(user, community):
        bans = Ban.objects.filter(user=user, community=community)
        for ban in bans:
            if ban.is_active():
                return True
        return False

class Clickable:
    click_class = None
    click_field = None

    def get_click_class(self):
        return self.click_class

    def get_click_field(self):
        return self.click_field

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()

        def create_click():
            self.get_click_class().objects.create(
                user=request.user,
                **{self.get_click_field(): obj}
            )
            print(f'created click for {self.click_field}')

        if request.user.is_authenticated:
            already = self.get_click_class().objects.filter(user=request.user, **{self.get_click_field(): obj})
            if already.exists():
                last = already[len(already) - 1]
                if timezone.now() - last.created_date >= datetime.timedelta(hours=1):
                    create_click()
            else:
                create_click()

        serializer = self.get_serializer(obj)
        return Response(serializer.data)

class CommunityViewSet(Clickable, viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    lookup_field = 'slug'

    click_class = CommunityClick
    click_field = 'community'

    @action(detail=True, methods=['get'])
    def topics(self, request, slug):
        community = self.get_object()
        serializer = TopicSerializer(community.topics(), many=True, context={'request': request})
        response = Response(serializer.data)
        return response

    @action(detail=True, methods=['get'])
    def am_i_mod(self, request, slug):
        community = self.get_object()
        am_i_mod = Moderator.objects.filter(user=request.user, community=community).exists()
        return Response({'am_i_mod': am_i_mod}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def subscribe(self, request, slug):
        community = self.get_object()
        user = request.user
        if Subscriber.objects.filter(user=user, community=community).exists():
            return Response(status=status.HTTP_400_BAD_REQUEST)
        Subscriber.objects.create(user=user, community=community)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unsubscribe(self, request, slug):
        community = self.get_object()
        user = request.user
        try:
            Subscriber.objects.get(user=user, community=community).delete()
            return Response(status=status.HTTP_200_OK)
        except Subscriber.DoesNotExist:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def am_i_subscribed(self, request, slug):
        community = self.get_object()
        user = request.user
        result = Subscriber.objects.filter(user=user, community=community).exists()
        return Response({'am_i_subscribed': result}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def am_i_banned(self, request, slug):
        return Response({'am_i_banned': BanManager.is_user_banned(
            user=request.user,
            community=self.get_object()
        )}, status=status.HTTP_200_OK)

    def get_queryset(self):
        queryset_length = 5
        real_length = Community.objects.count()
        if real_length < 5:
            queryset_length = real_length
        qs = Community.objects.order_by('-created_date')
        if self.action == 'list':
            return qs[:queryset_length]
        return qs

    def get_permissions(self):
        if self.action == ['create', 'am_i_mod', 'am_i_subscribed']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModerator()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        community = serializer.save()
        Moderator.objects.create(user=self.request.user, community=community)

class Subscriptions(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        subscribes = Subscriber.objects.filter(user=user).order_by('-joined_date')
        subscribed_communities = [subscribe.community for subscribe in subscribes]

        serializer = CommunitySerializer(subscribed_communities, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class Votable:
    vote_class = None
    vote_field_name = None

    def get_vote_class(self):
        return self.vote_class

    def get_vote_field_name(self):
        return self.vote_field_name

    @action(detail=True, methods=['post'])
    def up_vote(self, request, **kwargs):
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
    def down_vote(self, request, **kwargs):
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
    def remove_vote(self, request, **kwargs):
        obj = self.get_object()
        user = request.user
        vote_filter = {
            'user': user,
            self.get_vote_field_name(): obj
        }
        self.get_vote_class().objects.filter(**vote_filter).delete()
        return Response({'detail': 'Vote removed'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def my_vote(self, request, **kwargs):
        obj = self.get_object()
        user = request.user

        # not sure why permissions does not work here
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        try:
            vote_filter = {
                'user': user,
                self.get_vote_field_name(): obj
            }
            vote = self.get_vote_class().objects.get(**vote_filter)
            return Response({'value': vote.value}, status=status.HTTP_200_OK)
        except self.get_vote_class().DoesNotExist:
            return Response({'value': 0}, status=status.HTTP_200_OK)

class TopicViewSet(Clickable, Votable, viewsets.ModelViewSet):
    serializer_class = TopicSerializer
    lookup_field = 'slug'

    vote_class = TopicVote
    vote_field_name = 'topic'

    click_class = TopicClick
    click_field = 'topic'

    @action(detail=True, methods=['get'])
    def am_i_banned(self, request, slug):
        return Response({'am_i_banned': BanManager.is_user_banned(
            user=request.user,
            community=self.get_object().community
        )}, status=status.HTTP_200_OK)

    def get_queryset(self):
        return Topic.objects.order_by('-created_date')

    def get_permissions(self):
        if self.action in ['create', 'up_vote', 'down_vote', 'remove_vote']:
            return [permissions.IsAuthenticated(), IsNotBannedFromCommunity()]
        if self.action in ['my_vote', 'am_i_banned']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModeratorOfTopic()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        user = self.request.user
        community = serializer.validated_data.get('community')

        if BanManager.is_user_banned(user, community):
            raise PermissionDenied('You are banned from this community and cannot create topics in it.')

        topic = serializer.save(user=self.request.user)
        subs = Subscriber.objects.filter(community=topic.community)
        url = serializer.data.get('url')

        channel_layer = get_channel_layer()
        for sub in subs:
            notification = Notification.objects.create(
                user=sub.user,
                information='New Post on ' + topic.community.name,
                direct_url=url
            )

            serialized = NotificationSerializer(notification, context={'request': self.request})

            async_to_sync(channel_layer.group_send)(
                f'user_{sub.user.id}',
                {
                    'type': 'notify',
                    'notification': serialized.data
                }
            )

class CommentViewSet(Votable, viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    vote_class = CommentVote
    vote_field_name = 'comment'

    def get_permissions(self):
        if self.action == ['create', 'up_vote', 'down_vote', 'remove_vote', 'my_vote']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsModeratorOfComment()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    def perform_create(self, serializer):
        user = self.request.user
        community = serializer.validated_data.get('topic').get('community')

        if BanManager.is_user_banned(user, community):
            raise PermissionDenied('You are banned from this community and cannot create topics in it.')

        comment = serializer.save(user=self.request.user)
        url = serializer.data.get('url')

        channel_layer = get_channel_layer()
        if comment.upper_comment is None:
            user = comment.topic.user
            notification = Notification.objects.create(
                user=user,
                information='Someone commented on your post!',
                direct_url=url
            )
            serialized = NotificationSerializer(notification)
            async_to_sync(channel_layer.group_send)(
                f'user_{user.id}',
                {
                    'type': 'notify',
                    'notification': serialized.data
                }
            )
        else:
            user = comment.upper_comment.user
            notification = Notification.objects.create(
                user=user,
                information='Someone replied to your comment!',
                direct_url=url
            )
            serialized = NotificationSerializer(notification)
            async_to_sync(channel_layer.group_send)(
                f'user_{user.id}',
                {
                    'type': 'notify',
                    'notification': serialized.data
                }
            )

class BanViewSet(viewsets.ModelViewSet):
    queryset = Ban.objects.all()
    serializer_class = BanSerializer

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'update', 'destroy']:
            return [IsModeratorOfBan()]
        else:
            return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        ban = serializer.save()
        url = serializer.data.get('url')
        user = ban.user
        notification = Notification.objects.create(
            user=user,
            information='You have been banned from a community',
            direct_url=url
        )
        serialized = NotificationSerializer(notification)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'user_{user.id}',
            {
                'type': 'notify',
                'notification': serialized.data
            }
        )

class SearchAPI(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', None)
        if query is None:
            return Response([], status=status.HTTP_200_OK)

        search_results = Topic.objects.filter(
            Q(title__icontains=query) |
            Q(text__icontains=query) |
            Q(comments__text__icontains=query)
        ).distinct().annotate(
            vote_count=Count('topicvote'),
            view_count=Count('topicclick'),
            score=ExpressionWrapper(
                F('vote_count') + F('view_count'),
                output_field=IntegerField()
            )
        ).order_by('-score')[:5]

        serializer = TopicSerializer(search_results, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

# only for test purposes
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]