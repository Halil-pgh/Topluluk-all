import datetime

from django.db.models import Count, ExpressionWrapper, F, Sum, Q
from django.db.models.fields import IntegerField
from django.utils import timezone
from rest_framework import views, status, permissions
from rest_framework.response import Response

from communities.models import Community, Topic, Profile, TopicVote, CommentVote, TopicClick, Subscriber, \
    CommunityClick, Comment
from communities.serializers import CommunitySerializer, TopicSerializer, ProfileSerializer


class HotTopics(views.APIView):
    # today`s hot topics
    def get(self, request):
        one_day_ago = timezone.now() - datetime.timedelta(days=1)
        result = Topic.objects.filter(created_date__gt=one_day_ago).annotate(
            vote_value=Sum('topicvote__value'),
            view_value=Count('topicclick'),
            score=ExpressionWrapper(
                F('view_value') + F('vote_value') * 5,
                output_field=IntegerField()
            )
        ).order_by('-score')
        serializer = TopicSerializer(result, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class Recommendation(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = Profile.objects.get(user=user)
        limit = 10

        interacted_topics = TopicClick.objects.filter(user=user).values_list('topic', flat=True).union(
            TopicVote.objects.filter(user=user).values_list('topic', flat=True)
        )

        from pgvector.django import CosineDistance

        similar_topics = Topic.objects.exclude(
            id__in=interacted_topics
        ).filter(
            embedding__isnull=False
        ).order_by(
            CosineDistance('embedding', profile.interest_vector)
        )[:limit]

        serializer = TopicSerializer(similar_topics, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostSubscribedCommunities(views.APIView):
    def get(self, request):
        time_query = request.query_params.get('time', None)
        community_query = Community.objects.all()
        if time_query is not None:
            try:
                hours = int(time_query)
                real_time = timezone.now() - datetime.timedelta(hours=hours)
                communities = sorted(community_query, key=lambda c: c.subscriber_count_after(real_time), reverse=True)[:5]
                context = {'request': request, 'subscriber_count_after_time': real_time}
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid time parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            communities = sorted(community_query, key=lambda c: c.subscriber_count(), reverse=True)[:5]
            context = {'request': request}

        serializer = CommunitySerializer(communities, many=True, context=context)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostViewedCommunities(views.APIView):
    def get(self, request):
        time_query = request.query_params.get('time', None)
        community_query = Community.objects.all()
        if time_query is not None:
            try:
                hours = int(time_query)
                real_time = timezone.now() - datetime.timedelta(hours=hours)
                communities = sorted(community_query, key=lambda c: c.view_count_after(real_time), reverse=True)[:5]
                context = {'request': request, 'view_count_after_time': real_time}
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid time parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            communities = sorted(community_query, key=lambda c: c.total_view_count(), reverse=True)[:5]
            context = {'request': request}

        serializer = CommunitySerializer(communities, many=True, context=context)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostKarmaProfiles(views.APIView):
    def get(self, request):
        time_query = request.query_params.get('time', None)
        profile_query = Profile.objects.all()
        if time_query is not None:
            try:
                hours = int(time_query)
                real_time = timezone.now() - datetime.timedelta(hours=hours)
                profiles = sorted(profile_query, key=lambda p: p.karma_after(real_time), reverse=True)[:5]
                context = {'request': request, 'karma_after_time': real_time}
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid time parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            profiles = sorted(profile_query, key=lambda p: p.karma(), reverse=True)[:5]
            context = {'request': request}
        serializer = ProfileSerializer(profiles, many=True, context=context)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ActivityOfWebsite(views.APIView):
    all_activities = [Topic, Comment, Community, TopicClick, CommunityClick, TopicVote, CommentVote]

    def get(self, request):
        time_query = request.query_params.get('time', None)
        activity_count = 0
        if time_query is not None:
            try:
                hours = int(time_query)
                real_time = timezone.now() - datetime.timedelta(hours=hours)
                for activity in self.all_activities:
                    activity_count += activity.objects.filter(created_date__gt=real_time).count()
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid time parameter'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            for activity in self.all_activities:
                activity_count += activity.objects.count()
        return Response({'activity_count': activity_count}, status=status.HTTP_200_OK)