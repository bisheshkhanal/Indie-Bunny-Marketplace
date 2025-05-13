import firebase_admin
from firebase_admin import auth as firebase_auth
from django.http import JsonResponse
from .models import User, Player
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/api/"):
            request.user = AnonymousUser()

            id_token = self._get_token_from_header(request)
            if id_token:
                try:
                    decoded_token = firebase_auth.verify_id_token(id_token)
                    email = decoded_token.get('email')
                    logger.info(f"✅ Firebase user: {email}")

                    if email:
                        user, created = User.objects.get_or_create(
                            email=email,
                            defaults={
                                "name": email.split("@")[0],
                                "password": "firebase",
                                "role": "Player",
                                "is_active": True,
                                "wallet_balance": 0.00   
                            }
                        )
                        if created:
                            Player.objects.create(user=user)
                            logger.info(f"🧑‍💻 Created new Player: {email}")

                        request.user = user

                except Exception as e:
                    logger.error(f"🔥 Firebase token verification failed: {e}")
                    request.user = AnonymousUser()

        return self.get_response(request)

    def _get_token_from_header(self, request):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split("Bearer ")[1].strip()
        return None
