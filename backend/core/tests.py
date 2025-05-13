from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.utils import timezone
from core.models import *

class APITestSetup(APITestCase):
    def setUp(self):
        # Create users
        self.dev_user = User.objects.create(name="Dev", email="dev@test.com", password="devpass", role="Developer")
        Developer.objects.create(user=self.dev_user, portfolio_link="https://portfolio.dev")

        self.player_user = User.objects.create(name="Player", email="player@test.com", password="playerpass", role="Player")
        self.player_profile = Player.objects.create(user=self.player_user, wallet_balance=50.00)

        self.admin_user = User.objects.create(name="Admin", email="admin@test.com", password="adminpass", role="Admin")
        self.admin_profile = Admin.objects.create(user=self.admin_user, access_level="full")

        # Create game
        self.game = Game.objects.create(
            developer=self.dev_user,
            title="Space Blaster",
            description="Blast stuff in space",
            genre="Shooter",
            price=10.00,
            upload_date=timezone.now().date(),
            min_tip_required=5.00
        )

        # Listing
        self.listing = GameListing.objects.create(
            game=self.game,
            price=10.00,
            upload_date=timezone.now().date(),
            region_adjustment="NA"
        )
        RegularListing.objects.create(listing=self.listing)

        # Client with mock Firebase override
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer testtoken')
        self.override_user = self.player_user  # simulate player by default

    def override_auth(self, user):
        # Simulates Firebase middleware for unit tests
        self.client.handler._force_user = user

    def test_me_profile(self):
        self.override_auth(self.player_user)
        response = self.client.get('/api/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], self.player_user.email)
        
    def test_update_profile(self):
        self.override_auth(self.player_user)
        response = self.client.put('/api/update-profile/', {"name": "New Name"})
        self.assertEqual(response.status_code, 200)
        self.player_user.refresh_from_db()
        self.assertEqual(self.player_user.name, "New Name")


    def test_delete_account(self):
        self.override_auth(self.player_user)
        response = self.client.delete('/api/delete-account/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.player_user.id).exists())

    def test_wallet_topup(self):
        self.override_auth(self.player_user)
        response = self.client.post('/api/top_up_wallet/', {"amount": 20})
        self.assertEqual(response.status_code, 200)
        self.player_profile.refresh_from_db()
        self.assertEqual(float(self.player_profile.wallet_balance), 70.00)

    def test_tip_developer_success(self):
        self.override_auth(self.player_user)
        response = self.client.post('/api/tip-developer/', {
            "developer_id": self.dev_user.id,
            "amount": 10.00
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "Tip sent.")

    def test_tip_developer_insufficient_funds(self):
        self.player_profile.wallet_balance = 1.00
        self.player_profile.save()
        self.override_auth(self.player_user)
        response = self.client.post('/api/tip-developer/', {
            "developer_id": self.dev_user.id,
            "amount": 10.00
        })
        self.assertEqual(response.status_code, 403)

    def test_purchase_game_success(self):
        self.override_auth(self.player_user)
        response = self.client.post('/api/purchase-game/', {
            "listing_id": self.listing.id,
            "use_wallet": True
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "Game purchased.")

    def test_purchase_game_insufficient_funds(self):
        self.player_profile.wallet_balance = 1.00
        self.player_profile.save()
        self.override_auth(self.player_user)
        response = self.client.post('/api/purchase-game/', {
            "listing_id": self.listing.id,
            "use_wallet": True
        })
        self.assertEqual(response.status_code, 403)
        
    def test_purchase_external_payment(self):
        self.override_auth(self.player_user)
        self.player_profile.wallet_balance = 0  # Ensure wallet not used
        self.player_profile.save()
        response = self.client.post('/api/purchase-game/', {
            "listing_id": self.listing.id,
            "use_wallet": False
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "Game purchased.")


    def test_mystery_pick(self):
        self.override_auth(self.player_user)
        response = self.client.get('/api/mystery-pick/?amount=6.00')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(g["id"] == self.game.id for g in response.data))

    def test_mystery_claim_success(self):
        self.override_auth(self.player_user)
        response = self.client.post('/api/mystery-claim/', {
            "game_id": self.game.id,
            "tip_amount": 6.00
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "Game received from pool.")

    def test_listing_approval_promotes_player(self):
        # Simulate a new player uploading a game and getting promoted
        new_user = User.objects.create(name="Newbie", email="new@dev.com", password="newpass", role="Player")
        Game.objects.create(
            developer=new_user,
            title="Indie Gem",
            description="cool game",
            genre="Puzzle",
            price=5.00,
            upload_date=timezone.now().date(),
            min_tip_required=3.00
        )
        new_listing = GameListing.objects.create(
            game=self.game,
            price=10.00,
            upload_date=timezone.now().date(),
            region_adjustment="EU"
        )

        self.override_auth(self.admin_user)
        response = self.client.post('/api/approve-listing/', {
            "listing_id": new_listing.id
        })
        self.assertEqual(response.status_code, 200)


    def test_view_notifications(self):
        Notification.objects.create(user=self.player_user, message="New sale!")
        self.override_auth(self.player_user)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_view_purchase_history(self):
        game = Game.objects.create(developer=self.dev_user, title="Test Game", description="Fun", genre="RPG",
                                price=12.00, upload_date=timezone.now().date(), min_tip_required=5.00)
        Purchase.objects.create(user=self.player_user, game=game, amount=12.00)
        self.override_auth(self.player_user)
        response = self.client.get('/api/purchases/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(p["game"] == "Test Game" for p in response.data))

    def test_active_temp_listings(self):
        game = Game.objects.create(developer=self.dev_user, title="Temp Game", description="Limited",
                                genre="Action", price=10.00, upload_date=timezone.now().date(), min_tip_required=3.00)
        listing = GameListing.objects.create(game=game, price=10.00, upload_date=timezone.now().date(),
                                            region_adjustment="Global")
        TemporaryListing.objects.create(listing=listing, discount_percent=25.00,
                                        start_time=timezone.now() - timezone.timedelta(hours=1),
                                        end_time=timezone.now() + timezone.timedelta(hours=1))
        response = self.client.get('/api/listings/temporary/active/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_admin_unapproved_listings(self):
        game = Game.objects.create(developer=self.dev_user, title="Unapproved Game", description="Pending",
                                genre="Strategy", price=15.00, upload_date=timezone.now().date(), min_tip_required=4.00)
        listing = GameListing.objects.create(game=game, price=15.00, upload_date=timezone.now().date(),
                                            region_adjustment="CA")
        self.override_auth(self.admin_user)
        response = self.client.get('/api/admin/unapproved-listings/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(l["listing_id"] == listing.id for l in response.data))

    def test_developer_own_listings(self):
        game = Game.objects.create(developer=self.dev_user, title="Dev Game", description="Uploaded by dev",
                                genre="Puzzle", price=8.00, upload_date=timezone.now().date(), min_tip_required=2.00)
        GameListing.objects.create(game=game, price=8.00, upload_date=timezone.now().date(),
                                region_adjustment="Global")
        self.override_auth(self.dev_user)
        response = self.client.get('/api/developer/games/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(g["game_title"] == "Dev Game" for g in response.data))
        
    def test_search_games_by_genre(self):
        self.override_auth(self.player_user)
        response = self.client.get('/api/search-games/?genre=Shooter')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(g["title"] == "Space Blaster" for g in response.data))

    def test_admin_assign_user(self):
        self.override_auth(self.admin_user)
        response = self.client.post('/api/admin/assign-user/', {"user_id": self.player_user.id})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(MANAGES.objects.filter(admin=self.admin_profile, user=self.player_user).exists())
        
    def test_view_managed_users(self):
        MANAGES.objects.create(admin=self.admin_profile, user=self.player_user)
        self.override_auth(self.admin_user)
        response = self.client.get('/api/admin/managed-users/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)


    def test_game_stats(self):
        self.override_auth(self.player_user)

        # Simulate a purchase
        Purchase.objects.create(user=self.player_user, game=self.game, amount=self.game.price)

        # Simulate a tip
        Tip.objects.create(
            giver=self.player_user,
            receiver=self.dev_user,
            amount=10.00,
            date=timezone.now().date()
        )

        self.override_auth(self.dev_user)  # switch to dev to view stats
        response = self.client.get('/api/developer/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["title"], "Space Blaster")
        self.assertEqual(response.data[0]["purchases"], 1)
        self.assertEqual(response.data[0]["total_tips"], 10.0)
