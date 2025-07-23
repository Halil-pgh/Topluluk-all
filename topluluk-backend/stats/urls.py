from django.urls import path

from stats.views import MostSubscribedCommunities, MostKarmaProfiles, HotTopics, MostViewedCommunities

app_name = 'stats'
urlpatterns = [
    path('hot_topics/', HotTopics.as_view(), name='hot_topics'),
    path('most_viewed_communities/', MostViewedCommunities.as_view(), name='most_viewed_communities'),
    path('most_subscribed_communities/', MostSubscribedCommunities.as_view(), name='most_subscribed_communities'),
    path('most_karma_profiles/', MostKarmaProfiles.as_view(), name='most_karma_profiles'),
]