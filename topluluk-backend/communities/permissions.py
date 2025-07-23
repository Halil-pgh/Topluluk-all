from rest_framework import permissions

from communities.models import Profile, Moderator, Ban, Topic, Comment


class IsOwnerOrReadonly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # if it is readonly than it is marked as safe method
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user

class IsOwnerOrReadonlyForUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj == request.user

# returns False if it already has the profile
# returns True otherwise
class DoesUserDontHaveProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.method == 'POST':
            return not Profile.objects.filter(user=request.user).exists()
        return True

class IsNotAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return not request.user.is_authenticated

# permission for Community object
class IsModerator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return Moderator.objects.filter(user=request.user, community=obj).exists()
        return False

class IsModeratorOfComment(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not isinstance(obj, Comment):
            return False
        if request.user.is_authenticated:
            return Moderator.objects.filter(user=request.user, community=obj.topic.community).exists()
        return False

# object is treated as Topic
class IsModeratorOfTopic(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return Moderator.objects.filter(user=request.user, community=obj.community).exists()
        return False

# same as Topic but for Ban
class IsModeratorOfBan(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            # prevent the user trying to ban himself
            if obj.user.id == request.user.id:
                return False
            return Moderator.objects.filter(user=request.user, community=obj.community).exists()
        return False

class IsNotBannedFromCommunity(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        community = None
        if isinstance(obj, Topic):
            community = obj.community
        elif isinstance(obj, Comment):
            community = obj.topic.community
        else:
            print('Not handled type for Ban Permission')
        if request.user.is_authenticated:
            bans = Ban.objects.filter(user=request.user, community=community)
            if bans.exists():
                any_ban_active = False
                for ban in bans:
                    if ban.is_active():
                        any_ban_active = True
                        break
                return not any_ban_active
            return True
        return True