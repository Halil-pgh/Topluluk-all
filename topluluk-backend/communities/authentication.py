from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed


class CookieTokenAuthentication(TokenAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get('authToken')
        if not token:
            return None
        try:
            user = Token.objects.get(key=token).user
        except Token.DoesNotExist:
            raise AuthenticationFailed('Invalid Token')
        return user, token