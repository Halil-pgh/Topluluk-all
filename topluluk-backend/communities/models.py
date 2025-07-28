from django.contrib.auth.models import User
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from pgvector.django import VectorField
import numpy as np

from communities.embedding import generate_embedding


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='profile_images/')
    description = models.TextField(default='')
    links = models.URLField(blank=True)
    interest_vector = VectorField(dimensions=384, null=True)
    weighted_sum_vector = VectorField(dimensions=384, null=True)
    total_weight = models.FloatField(default=0)
    slug = models.SlugField(unique=True, blank=True)

    def update_interaction(self, interaction_embedding, weight):
        ws_vec = np.array(self.weighted_sum_vector or np.zeros(384))
        tw = self.total_weight

        ws_vec += weight * np.array(interaction_embedding)
        tw += weight

        self.weighted_sum_vector = ws_vec.tolist()
        self.total_weight = tw
        self.interest_vector = (ws_vec / tw).tolist()
        self.save()

    def karma(self):
        topic_karma = TopicVote.objects.filter(topic__user=self.user).aggregate(
            total=models.Sum('value')
        )['total'] or 0

        comment_karma = CommentVote.objects.filter(comment__user=self.user).aggregate(
            total=models.Sum('value')
        )['total'] or 0
        return topic_karma + comment_karma

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.user.username)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.display_name

class Community(models.Model):
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to='community_images/')
    description = models.TextField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    embedding = VectorField(dimensions=384, blank=True)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if not self.embedding:
            self.embedding = generate_embedding(self.name + ' ' + self.description)
        super().save(*args, **kwargs)

    def topics(self):
        return self.topic_set.all()

    def subscriber_count(self):
        return self.subscriber_set.count()

    def total_view_count(self):
        total = self.communityclick_set.count()
        for topic in self.topic_set.all():
            total += topic.view_count()
        return total

    def __str__(self):
        return self.name

class Subscriber(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    joined_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'community')

    def __str__(self):
        return f'{self.user.username} is subscribed to {self.community.name}'

class Moderator(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.user.username} is a moderator of {self.community.name}'

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    information = models.TextField(null=False)
    direct_url = models.URLField(blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.information} notification to {self.user.username}'

class Topic(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, unique=True)
    text = models.TextField(null=False)
    image = models.ImageField(upload_to='topic_images/', null=True)
    created_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    embedding = VectorField(dimensions=384, blank=True)
    slug = models.SlugField(unique=True, blank=True)

    def view_count(self):
        return self.topicclick_set.count()

    def vote_count(self):
        return self.topicvote_set.aggregate(total=models.Sum('value'))['total'] or 0

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.embedding:
            self.embedding = generate_embedding(self.title + ' ' + self.text)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Comment(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(null=False)
    created_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    embedding = VectorField(dimensions=384, blank=True)

    upper_comment = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )

    def vote_count(self):
        return self.commentvote_set.aggregate(total=models.Sum('value'))['total'] or 0

    def comment_count(self):
        return self.replies.count()

    def save(self, *args, **kwargs):
        if not self.embedding:
            self.embedding = generate_embedding(self.text)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username}: {self.text}'

class VoteBase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    value = models.SmallIntegerField(default=0) # 1 for upvote, -1 for down vote

    class Meta:
        abstract = True

class TopicVote(VoteBase):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        self.user.profile.update_interaction(self.topic.embedding, weight=3*self.value)
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('topic', 'user')

    def __str__(self):
        return f'{self.user.username} voted {self.value} on "{self.topic.text}" topic.'

class CommentVote(VoteBase):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        self.user.profile.update_interaction(self.comment.embedding, weight=3*self.value)
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('comment', 'user')

    def __str__(self):
        return f'{self.user.username} voted {self.value} on "{self.comment.text}" comment.'

class ClickBase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

class TopicClick(ClickBase):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        self.user.profile.update_interaction(self.topic.embedding, weight=1)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username} has clicked to {self.topic.title} topic'

class CommunityClick(ClickBase):
    community = models.ForeignKey(Community, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        self.user.profile.update_interaction(self.community.embedding, weight=0.5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username} has clicked to {self.community.name} community'

class Ban(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def is_active(self):
        if self.expires_at:
            return timezone.now() < self.expires_at
        return True

    def __str__(self):
        return f'{self.user.username} is banned from {self.community.name}.'