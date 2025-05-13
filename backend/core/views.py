from firebase_admin import auth as firebase_auth
from decimal import Decimal
from django.db import IntegrityError
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import *
from .serializers import *
from django.shortcuts import get_object_or_404
from functools import wraps
from django.utils import timezone
import random
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

# === Decorators ===
def require_auth_user(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user:
            return Response({'error': 'Authentication required'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper

def require_role(required_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, 'user', None)

            if not user or not isinstance(user, User):
                return Response({'error': 'Unauthorized'}, status=403)

            # treatss 'developer' as a superset of 'Pplayer'
            if user.role == 'Developer' and 'Player' in required_roles:
                return view_func(request, *args, **kwargs)

            if user.role not in required_roles:
                return Response({'error': 'Unauthorized'}, status=403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

# def require_role(required_roles):
#     def decorator(view_func):
#         @wraps(view_func)
#         def wrapper(request, *args, **kwargs):
#             if not hasattr(request, 'user') or not isinstance(request.user, User) or request.user.role not in required_roles:
#                 return Response({'error': 'Unauthorized'}, status=403)
#             return view_func(request, *args, **kwargs)
#         return wrapper
#     return decorator

# === Utility Functions ===

# This function is used to log admin actions for auditing purposes.
def log_admin_action(admin_user, message):
    Notification.objects.create(user=admin_user.user, message=f"[LOG] {message}")
    
# This function syncs the user with Firebase Authentication. If the user does not exist, it creates a new one.
def sync_firebase_user(email, password="pass"):
    try:
        return firebase_auth.get_user_by_email(email)
    except firebase_auth.UserNotFoundError:
        return firebase_auth.create_user(email=email, password=password)

# === ViewSets ===
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

    def perform_destroy(self, instance):
        if self.request.user.role == 'Admin' or instance.developer == self.request.user:
            instance.delete()
        else:
            raise PermissionError("Not authorized to delete this game.")

class GameListingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GameListing.objects.select_related('game', 'game__developer').all()
    serializer_class = GameListingSerializer


class RegularListingViewSet(viewsets.ModelViewSet):
    queryset = RegularListing.objects.all()
    serializer_class = RegularListingSerializer

class TemporaryListingViewSet(viewsets.ModelViewSet):
    queryset = TemporaryListing.objects.all()
    serializer_class = TemporaryListingSerializer

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer

class TipViewSet(viewsets.ModelViewSet):
    queryset = Tip.objects.all()
    serializer_class = TipSerializer

class WishlistViewSet(viewsets.ModelViewSet):
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer

class WishlistEntriesViewSet(viewsets.ModelViewSet):
    queryset = WishlistEntries.objects.all()
    serializer_class = WishlistEntriesSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

class MysteryPoolViewSet(viewsets.ModelViewSet):
    queryset = MysteryPool.objects.all()
    serializer_class = MysteryPoolSerializer

class ReceivesViewSet(viewsets.ModelViewSet):
    queryset = RECEIVES.objects.all()
    serializer_class = RECEIVESSerializer

# === Custom Endpoints ===

@api_view(['POST'])
@require_auth_user
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Create Player entry
        Player.objects.create(user=user, wallet_balance=0.00)

        # Attempt to assign to a random admin
        admins = Admin.objects.all()
        if admins.exists():
            assigned_admin = random.choice(admins)
            MANAGES.objects.get_or_create(admin=assigned_admin, user=user)
            Notification.objects.create(
                user=assigned_admin.user,
                message=f"You've been assigned a new user: {user.name}"
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    print("Registration failed:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@require_auth_user
def mystery_pick(request):
    amount = float(request.GET.get("amount", 0))
    eligible_games = Game.objects.filter(min_tip_required__lte=amount)
    selected = random.sample(list(eligible_games), min(3, len(eligible_games)))
    return Response([{
        "id": g.id,
        "title": g.title,
        "price": g.price,
        "min_tip_required": g.min_tip_required
    } for g in selected])

@api_view(['POST'])
@require_auth_user
def mystery_claim(request):
    game_id = request.data.get("game_id")
    tip_amount = Decimal(request.data.get("tip_amount", 0))
    try:
        game = Game.objects.get(id=game_id)
        if tip_amount < game.min_tip_required:
            return Response({"error": "Tip too low"}, status=403)
        pool = MysteryPool.objects.create(
            entry_date=timezone.now().date(),
            revenue_split=50.00  # hardcoded for now
        )
        RECEIVES.objects.create(user=request.user, game=game, pool=pool)
        Notification.objects.create(user=game.developer, message=f"Your game '{game.title}' was picked from the mystery pool!")
        return Response({"status": "Game received from pool."})
    except Game.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)


@api_view(['POST'])
@require_auth_user
def tip_developer(request):
    receiver_id = request.data.get("developer_id")
    amount = Decimal(request.data.get("amount", 0))
    try:
        receiver = User.objects.get(id=receiver_id, role="Developer")
        player = Player.objects.get(user=request.user)
        if player.wallet_balance < amount:
            return Response({"error": "Insufficient wallet funds."}, status=403)
        player.wallet_balance -= amount
        player.save()

        Tip.objects.create(
            giver=request.user,
            receiver=receiver,
            amount=amount,
            date=timezone.now().date()
        )
        Notification.objects.create(user=receiver, message=f"You received a tip of ${amount}!")
        return Response({"status": "Tip sent."})
    except User.DoesNotExist:
        return Response({"error": "Developer not found"}, status=404)

@api_view(['POST'])
@require_auth_user
def purchase_game(request):
    print("DEBUG USER:", request.user.email)
    listing_id = request.data.get("listing_id")
    use_wallet = str(request.data.get("use_wallet", "true")).lower() == "true"

    try:
        listing = GameListing.objects.get(id=listing_id)
      
        if use_wallet:
            if request.user.wallet_balance < listing.price:
                return Response({"error": "Insufficient wallet funds"}, status=403)
            request.user.wallet_balance -= listing.price
            request.user.save()
        else: 
            # Log placeholder payment method, we can use paypal or stripe or something but that functionality isn't done yet. 
            Notification.objects.create(user=request.user, message=f"You purchased '{listing.game.title}' using external payment.")
            pass

        purchase = Purchase.objects.create(
            user=request.user,
            game=listing.game,
            amount=listing.price
        )
        BUYS.objects.create(
            user=request.user,
            purchase=purchase,
            listing=listing
        )
        Notification.objects.create(user=listing.game.developer, message=f"Your game '{listing.game.title}' was purchased!")
        return Response({"status": "Game purchased."})

    except GameListing.DoesNotExist:
        return Response({"error": "Listing not found"}, status=404)


    
@api_view(['POST'])
@require_auth_user
@require_role(['Admin'])
def assign_user(request):
    admin = Admin.objects.get(user=request.user)
    user_id = request.data.get("user_id")
    try:
        user = User.objects.get(id=user_id)
        MANAGES.objects.create(admin=admin, user=user)
        log_admin_action(admin, f"Assigned user ID {user.id} ({user.name}) to admin {admin.user.name}")

        return Response({"status": f"User {user.name} assigned to you."})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
@api_view(['DELETE'])
@require_auth_user
@require_role(['Admin'])
def delete_managed_user(request):
    user_id = request.data.get("user_id")
    try:
        user = User.objects.get(id=user_id)
        MANAGES.objects.filter(user=user).delete()
        user.delete()
        return Response({"status": "User deleted by admin."})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)


@api_view(['GET'])
@require_auth_user
@require_role(['Admin'])
def view_managed_users(request):
    admin = Admin.objects.get(user=request.user)
    managed = MANAGES.objects.filter(admin=admin)
    return Response([{
        "user_id": m.user.id,
        "name": m.user.name,
        "email": m.user.email,
        "role": m.user.role
    } for m in managed])


@api_view(['GET'])
@require_auth_user
def my_profile(request):
    user = request.user
    if not user or not hasattr(user, 'email'):
        return Response({"error": "User not authenticated"}, status=401)

    return Response({
        "name": getattr(user, "name", "Anonymous"),
        "email": user.email,
        "role": getattr(user, "role", "Anonymous"),
        "country": getattr(user, "country", None),
        "wallet_balance": getattr(user, "wallet_balance", 0.0)  # Added wallet_balance
    })
    
@api_view(['PUT'])
@require_auth_user
def update_my_password(request):
    new_password = request.data.get("password")
    if not new_password or len(new_password) < 6:
        return Response({"error": "Password too short."}, status=400)

    user = request.user
    user.password = new_password
    user.save()
    return Response({"status": "Password updated."})


    
@api_view(['PUT'])
@require_auth_user
def update_profile(request):
    user = request.user
    user.name = request.data.get("name", user.name)
    user.email = request.data.get("email", user.email)
    user.password = request.data.get("password", user.password)
    user.save()
    return Response({"status": "Profile updated."})

    
@api_view(['DELETE'])
@require_auth_user
def delete_my_account(request):
    request.user.delete()
    return Response({"status": "Account deleted."})



@api_view(['PUT'])
@require_auth_user
def update_wallet_balance(request):
    user = request.user
    try:
        new_balance = request.data.get('wallet_balance')
        if new_balance is None:
            return Response({"error": "Wallet balance not provided"}, status=400)

        user.wallet_balance = new_balance
        user.save()
        return Response({"message": "Wallet balance updated", "new_balance": float(user.wallet_balance)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@require_auth_user
@require_role(['Developer', 'Player'])
def upload_game(request):
    data = request.data
    required_fields = ["title", "description", "genre", "price"]
    if not all(field in data for field in required_fields):
        return Response({"error": "Missing required fields"}, status=400)

    is_temporary = data.get("is_temporary", False)
    start_time = data.get("start_time")
    end_time = data.get("end_time")

    pending = PendingGame.objects.create(
        developer=request.user,
        title=data["title"],
        description=data["description"],
        genre=data["genre"],
        price=Decimal(data["price"]),
        min_tip_required=Decimal(data.get("min_tip_required", 0)),
        region_adjustment=data.get("region_adjustment", "Global"),
        image_url=data.get("image_url"),
        is_temporary=is_temporary,
        start_time=start_time if is_temporary else None,
        end_time=end_time if is_temporary else None
    )

    Notification.objects.create(
        user=request.user,
        message=f"Game '{data['title']}' uploaded and is pending admin approval."
    )
    return Response({"status": "Game uploaded and is pending approval."}, status=201)


@api_view(['DELETE'])
@require_auth_user
@require_role(['Developer', 'Admin'])
def delete_game(request):
    game_id = request.data.get("game_id")
    try:
        game = Game.objects.get(id=game_id)
        if request.user.role == 'Admin' or game.developer == request.user:
            game.delete()
            return Response({"status": "Game deleted successfully."})
        else:
            return Response({"error": "Unauthorized"}, status=403)
    except Game.DoesNotExist:
        return Response({"error": "Game not found"}, status=404)


@api_view(['DELETE'])
@require_auth_user
@require_role(['Admin'])
def reject_pending_game(request):
    pending_id = request.data.get("pending_id")
    try:
        pending = PendingGame.objects.get(id=pending_id)
        Notification.objects.create(
            user=pending.developer,
            message=f"Your game '{pending.title}' was rejected by admin."
        )
        pending.delete()
        return Response({"status": "Pending game rejected."})
    except PendingGame.DoesNotExist:
        return Response({"error": "Pending game not found"}, status=404)


@api_view(['POST'])
@require_auth_user
@require_role(['Admin'])
def approve_pending_game(request):
    pending_id = request.data.get("pending_id")
    try:
        pending_game = PendingGame.objects.get(id=pending_id)
        admin = Admin.objects.get(user=request.user)

        # Create Game
        game = Game.objects.create(
            developer=pending_game.developer,
            title=pending_game.title,
            description=pending_game.description,
            genre=pending_game.genre,
            price=pending_game.price,
            min_tip_required=pending_game.min_tip_required,
            upload_date=timezone.now().date(),
            image_url=pending_game.image_url
        )

        # Create Listing
        listing = GameListing.objects.create(
            game=game,
            price=pending_game.price,
            upload_date=timezone.now().date(),
            region_adjustment=pending_game.region_adjustment
        )

        # Create correct listing type
        if pending_game.is_temporary:
            TemporaryListing.objects.create(
                listing=listing,
                start_time=pending_game.start_time,
                end_time=pending_game.end_time,
                discount_percent=0
            )
        else:
            RegularListing.objects.create(listing=listing)

        # Promote to developer
        if pending_game.developer.role != "Developer":
            pending_game.developer.role = "Developer"
            pending_game.developer.save()
            Developer.objects.create(user=pending_game.developer, portfolio_link="")

        Notification.objects.create(
            user=pending_game.developer,
            message=f"Your game '{game.title}' has been approved and is now live!"
        )

        pending_game.delete()
        return Response({"status": "Game approved and published."})

    except PendingGame.DoesNotExist:
        return Response({"error": "Pending game not found"}, status=404)


@api_view(['PUT'])
@require_auth_user
def update_my_country(request):
    new_country = request.data.get("country")
    if not new_country:
        return Response({"error": "Country is required."}, status=400)

    user = request.user
    user.country = new_country
    user.save()
    return Response({"status": "Country updated."})


@api_view(['GET'])
def search_games(request):
    genre = request.GET.get("genre")
    query = request.GET.get("query")

    games = Game.objects.all()

    if genre:
        games = games.filter(genre__iexact=genre)

    if query:
        games = games.filter(
            models.Q(title__icontains=query) |
            models.Q(description__icontains=query)
        )

    return Response(GameSerializer(games, many=True).data)


@api_view(['GET'])
@require_auth_user
def view_wishlist(request):
    wishlist = Wishlist.objects.filter(user=request.user).first()
    if not wishlist:
        return Response([])
    entries = WishlistEntries.objects.filter(wishlist=wishlist)
    return Response([{
        "listing_id": e.listing.id,
        "title": e.listing.game.title,
        "price": e.listing.price
    } for e in entries])


@api_view(['POST'])
@require_auth_user
def add_to_wishlist(request):
    listing_id = request.data.get("listing_id")
    try:
        listing = GameListing.objects.get(id=listing_id)
        wishlist, _ = Wishlist.objects.get_or_create(
            user=request.user,
            defaults={'added_date': timezone.now().date()}
        )
        WishlistEntries.objects.get_or_create(
            wishlist=wishlist,
            listing=listing,
            added_date=timezone.now().date()
        )
        return Response({"status": "Added to wishlist."})
    except GameListing.DoesNotExist:
        return Response({"error": "Listing not found"}, status=404)
    

@api_view(['POST'])
@require_auth_user
def remove_from_wishlist(request):
    listing_id = request.data.get("listing_id")
    try:
        wishlist = Wishlist.objects.get(user=request.user)
        entry = WishlistEntries.objects.get(wishlist=wishlist, listing_id=listing_id)
        entry.delete()
        return Response({"status": "Removed from wishlist."})
    except (Wishlist.DoesNotExist, WishlistEntries.DoesNotExist):
        return Response({"error": "Item not in wishlist"}, status=404)


@api_view(['GET'])
@require_auth_user
def purchase_history(request):
    purchases = Purchase.objects.filter(user=request.user).order_by('-id')  # most recent first
    return Response([{
        "game": p.game.title,
        "amount": float(p.amount),
        "listing_id": BUYS.objects.filter(user=request.user, purchase=p).first().listing.id if BUYS.objects.filter(user=request.user, purchase=p).exists() else None
    } for p in purchases])


@api_view(['GET'])
@require_auth_user
def get_country_multiplier(request):
    user_country = getattr(request.user, 'country', None)
    if not user_country:
        return Response({"multiplier": 1.0})  # Default no adjustment

    try:
        pricing = CountryPricing.objects.get(country__iexact=user_country)
        return Response({"multiplier": float(pricing.price_multiplier)})
    except CountryPricing.DoesNotExist:
        return Response({"multiplier": 1.0})


@api_view(['GET'])
def all_game_listings(request):
    """
    Returns all game listings (both regular and temporary).
    """
    listings = GameListing.objects.all()
    data = []

    for listing in listings:
        temporary = getattr(listing, 'temporarylisting', None)
        data.append({
            "listing_id": listing.id,
            "game_title": listing.game.title,
            "price": listing.price,
            "developer": listing.game.developer.name,
            "genre": listing.game.genre,
            "image_url": getattr(listing.game, 'image_url', None),
            "is_temporary": temporary is not None,
            "discount_percent": getattr(temporary, 'discount_percent', None),
        })

    return Response(data)

@api_view(['GET'])
@require_auth_user
@require_role(['Admin'])
def unapproved_listings(request):
    pending = PendingGame.objects.all()
    return Response([{
        "id": g.id,
        "title": g.title,
        "price": g.price,
        "genre": g.genre,
        "developer_email": g.developer.email,
        "upload_date": g.upload_date
    } for g in pending])
    

@api_view(['GET'])
def active_temp_listings(request):
    now = timezone.now()
    active = TemporaryListing.objects.filter(start_time__lte=now, end_time__gte=now)
    return Response([{
        "listing_id": t.listing.id,
        "game_title": t.listing.game.title,
        "discount_percent": t.discount_percent
    } for t in active])


@api_view(['GET'])
@require_auth_user
@require_role(['Developer', 'Player'])
def pending_games(request):
    pending_games = PendingGame.objects.filter(developer=request.user)
    return Response([{
        "id": game.id,
        "title": game.title,
        "price": game.price,
        "genre": game.genre,
        "upload_date": game.upload_date
    } for game in pending_games])


@api_view(['GET'])
@require_auth_user
@require_role(['Developer', 'Player'])
def developer_games(request):
    listings = GameListing.objects.filter(game__developer=request.user)
    return Response([{
        "listing_id": l.id,
        "game_title": l.game.title,
        "price": l.price
    } for l in listings])

@api_view(['GET'])
@require_auth_user
@require_role(['Developer'])
def game_stats(request):
    games = Game.objects.filter(developer=request.user)
    data = []
    for game in games:
        purchases = Purchase.objects.filter(game=game).count()
        total_tips = Tip.objects.filter(receiver=request.user).aggregate(models.Sum('amount'))['amount__sum'] or 0
        data.append({
            "title": game.title,
            "purchases": purchases,
            "total_tips": float(total_tips)
        })
    return Response(data)


@api_view(['GET'])
@require_auth_user
def get_notifications(request):
    notifs = Notification.objects.filter(user=request.user).order_by('-timestamp')
    return Response([{
        "id": n.id,
        "message": n.message,
        "timestamp": n.timestamp,
        "read": n.read,
        "target_url": n.target_url
    } for n in notifs])
    
    
    
@api_view(['DELETE'])
@require_auth_user
def clear_notifications(request):
    Notification.objects.filter(user=request.user).delete()
    return Response({"status": "All notifications cleared."})


@api_view(['PUT'])
@require_auth_user
def mark_notification_read(request):
    notif_id = request.data.get("id")
    try:
        notif = Notification.objects.get(id=notif_id, user=request.user)
        notif.read = True
        notif.save()
        return Response({"status": "Notification marked as read."})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found."}, status=404)



# === Utility Seed Endpoint ===
@api_view(['POST'])
def seed_database(request):
    try:
        sync_firebase_user("dev@example.com", "pass123")
        sync_firebase_user("player@example.com", "pass123")
        sync_firebase_user("admin@example.com", "pass123")

        user1, _ = User.objects.get_or_create(
            email="dev@example.com",
            defaults={"name": "DevUser", "password": "123", "role": "Developer"}
        )
        Developer.objects.get_or_create(user=user1, portfolio_link="http://devgames.com")

        user2, _ = User.objects.get_or_create(
            email="player@example.com",
            defaults={"name": "PlayerUser", "password": "pass123", "role": "Player"}
        )
        Player.objects.get_or_create(user=user2)

        user3, _ = User.objects.get_or_create(
            email="admin@example.com",
            defaults={"name": "AdminUser", "password": "pass123", "role": "Admin"}
        )
        Admin.objects.get_or_create(user=user3, access_level="full")

        game, _ = Game.objects.get_or_create(
            developer=user1,
            title="Alien Ducks",
            defaults={
                "description": "Shoot ducks in space",
                "genre": "Shooter",
                "price": 10.00,
                "upload_date": timezone.now().date(),
                "min_tip_required": 5.00
            }
        )

        listing, _ = GameListing.objects.get_or_create(
            game=game,
            defaults={
                "price": 10.00,
                "upload_date": timezone.now().date(),
                "region_adjustment": "US"
            }
        )
        RegularListing.objects.get_or_create(listing=listing)

        return Response({"status": "Seeded database with synced Firebase users."}, status=201)

    except IntegrityError as e:
        return Response({"error": str(e)}, status=409)



@api_view(['POST'])
def reset_seed_database(request):
    try:
        User.objects.all().delete()
        Developer.objects.all().delete()
        Player.objects.all().delete()
        Admin.objects.all().delete()
        Game.objects.all().delete()
        GameListing.objects.all().delete()
        RegularListing.objects.all().delete()
        TemporaryListing.objects.all().delete()
        Purchase.objects.all().delete()
        BUYS.objects.all().delete()
        Tip.objects.all().delete()
        MysteryPool.objects.all().delete()
        RECEIVES.objects.all().delete()
        Wishlist.objects.all().delete()
        WishlistEntries.objects.all().delete()
        Notification.objects.all().delete()
        MANAGES.objects.all().delete()
        APPROVES.objects.all().delete()

        sync_firebase_user("dev@example.com", "pass123")
        sync_firebase_user("player@example.com", "pass123")
        sync_firebase_user("admin@example.com", "pass123")

        user1 = User.objects.create(name="DevUser", email="dev@example.com", password="pass", role="Developer")
        Developer.objects.create(user=user1, portfolio_link="http://devgames.com")

        user2 = User.objects.create(name="PlayerUser", email="player@example.com", password="pass", role="Player", wallet_balance=100.00)
        Player.objects.create(user=user2)  # Removed wallet_balance

        user3 = User.objects.create(name="AdminUser", email="admin@example.com", password="pass", role="Admin")
        Admin.objects.create(user=user3, access_level="full")

        for i in range(10):
            game = Game.objects.create(
                developer=user1,
                title=f"Game {i+1}",
                description=f"Description for Game {i+1}",
                genre="Action" if i % 2 == 0 else "Puzzle",
                price=5.00 + i,
                upload_date=timezone.now().date(),
                min_tip_required=2.00 + i
            )
            listing = GameListing.objects.create(
                game=game,
                price=5.00 + i,
                upload_date=timezone.now().date(),
                region_adjustment="Global"
            )
            if i % 2 == 0:
                RegularListing.objects.create(listing=listing)
            else:
                TemporaryListing.objects.create(
                    listing=listing,
                    discount_percent=20.00,
                    start_time=timezone.now() - timezone.timedelta(days=1),
                    end_time=timezone.now() + timezone.timedelta(days=2)
                )

        return Response({"status": "Reset + Firebase-synced 10+ listings."}, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=500)



# === Debug Dashboard Endpoint ===

@api_view(['GET'])
@require_auth_user
@require_role(['Admin'])
def debug_dashboard(request):
    try:
        data = {
            "Users": {
                "Total": User.objects.count(),
                "Players": Player.objects.count(),
                "Developers": Developer.objects.count(),
                "Admins": Admin.objects.count()
            },
            "Games": Game.objects.count(),
            "Listings": {
                "Total": GameListing.objects.count(),
                "Regular": RegularListing.objects.count(),
                "Temporary": TemporaryListing.objects.count()
            },
            "Tips": {
                "Count": Tip.objects.count(),
                "Total Amount": float(Tip.objects.aggregate(models.Sum('amount'))['amount__sum'] or 0)
            },
            "Purchases": {
                "Count": Purchase.objects.count(),
                "Total Amount": float(Purchase.objects.aggregate(models.Sum('amount'))['amount__sum'] or 0)
            },
            "Wishlist Entries": WishlistEntries.objects.count(),
            "Mystery Pool Distributions": RECEIVES.objects.count(),
            "Notifications": Notification.objects.count(),
            "Admin Activity": {
                "Approved Listings": APPROVES.objects.count(),
                "Users Managed": MANAGES.objects.count()
            }
        }
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)