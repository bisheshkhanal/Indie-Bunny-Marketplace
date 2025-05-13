from rest_framework.authentication import BaseAuthentication
from firebase_admin import auth as firebase_auth
from django.contrib.auth.models import AnonymousUser
from .models import User, Player

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        id_token = auth_header.split('Bearer ')[1]

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            email = decoded_token.get('email')

            if not email:
                return None

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "name": email.split("@")[0],
                    "password": "firebase",
                    "role": "Player",
                    "is_active": True
                }
            )
            if created:
                Player.objects.create(user=user, wallet_balance=0.00)

            return (user, None)

        except Exception:
            return None