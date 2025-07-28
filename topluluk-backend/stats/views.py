import datetime

from django.db.models import Count, ExpressionWrapper, F, Sum
from django.db.models.fields import IntegerField
from django.utils import timezone
from rest_framework import views, status
from rest_framework.response import Response

from communities.models import Community, Topic, Profile, TopicVote, CommentVote
from communities.serializers import CommunitySerializer, TopicSerializer, ProfileSerializer


class HotTopics(views.APIView):
    # today`s hot topics
    def get(self, request):
        one_day_ago = timezone.now() - datetime.timedelta(days=1)
        result = Topic.objects.filter(created_date__gt=one_day_ago).annotate(
            vote_count=Sum('topicvote__value'),
            view_count=Count('topicclick'),
            score=ExpressionWrapper(
                F('view_count') + F('vote_count') * 5,
                output_field=IntegerField()
            )
        ).order_by('-score')[:5]
        serializer = TopicSerializer(result, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostSubscribedCommunities(views.APIView):
    def get(self, request):
        result = Community.objects.annotate(
            number_of_subscribers=Count('subscriber')
        ).order_by('-number_of_subscribers')[:4]
        serializer = CommunitySerializer(result, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostViewedCommunities(views.APIView):
    def get(self, request):
        result = Community.objects.annotate(
            total=Count('communityclick')
        ).order_by('-total')
        serializer = CommunitySerializer(result, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MostKarmaProfiles(views.APIView):
    def get(self, request):
        profiles = Profile.objects.all()
        profiles = sorted(profiles, key=lambda p: p.karma(), reverse=True)[:5]
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
