from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from django.utils import timezone


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='profile_images/')
    description = models.TextField(default='')
    links = models.URLField(blank=True)
    slug = models.SlugField(unique=True, blank=True)

    def karma(self):
        topic_karma = self.user.topicvote_set.aggregate(total=models.Sum('value'))['total'] or 0
        comment_karma = self.user.commentvote_set.aggregate(total=models.Sum('value'))['total'] or 0
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
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
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
    slug = models.SlugField(unique=True, blank=True)

    def view_count(self):
        return self.topicclick_set.count()

    def vote_count(self):
        return self.topicvote_set.aggregate(total=models.Sum('value'))['total'] or 0

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Comment(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(null=False)
    created_date = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # TODO: add reply_count field so that frontend doesnt have to make recursive call to count replies

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

    def __str__(self):
        return f'{self.user.username}: {self.text}'

class VoteBase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    value = models.SmallIntegerField(default=0) # 1 for upvote, -1 for down vote

    class Meta:
        abstract = True

class TopicVote(VoteBase):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('topic', 'user')

    def __str__(self):
        return f'{self.user.username} voted {self.value} on "{self.topic.text}" topic.'

class CommentVote(VoteBase):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)

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

    def __str__(self):
        return f'{self.user.username} has clicked to {self.topic.title} topic'

class CommunityClick(ClickBase):
    community = models.ForeignKey(Community, on_delete=models.CASCADE)

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