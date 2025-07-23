from email.policy import default

from django.db.models import Count, ExpressionWrapper, F, Sum
from django.db.models.fields import IntegerField
from rest_framework import views, status
from rest_framework.response import Response

from communities.models import Community, Topic, Profile
from communities.serializers import CommunitySerializer, TopicSerializer, ProfileSerializer


class HotTopics(views.APIView):
    # today`s hot topics
    def get(self, request):
        result = Topic.objects.annotate(
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
        result = Profile.objects.annotate(
            topic_karma=Sum('user__topicvote__value', default=0),
            comment_karma=Sum('user__commentvote__value', default=0),
            karma=ExpressionWrapper(
                F('topic_karma') + F('comment_karma'),
                output_field=IntegerField()
            )
        ).order_by('-karma')[:5]
        serializer = ProfileSerializer(result, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
