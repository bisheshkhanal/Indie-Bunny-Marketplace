from . import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'games', GameViewSet)
router.register(r'listings', GameListingViewSet)
router.register(r'purchases', PurchaseViewSet)
router.register(r'tips', TipViewSet)
router.register(r'wishlist', WishlistViewSet)
router.register(r'wishlist-entries', WishlistEntriesViewSet)

urlpatterns = [
    path('seed-database/', views.seed_database),
    path('me/', views.my_profile),
    path('register/', views.register_user),
    path('mystery-pick/', views.mystery_pick),
    path('mystery-claim/', views.mystery_claim),
    path('tip-developer/', views.tip_developer),
    path('purchase-game/', views.purchase_game),
    path('wishlist/add/', views.add_to_wishlist),
    path('wishlist/remove/', views.remove_from_wishlist),
    path('wishlist/', views.view_wishlist),
    path('notifications/', views.get_notifications),
    path('purchases/', views.purchase_history),
    path('listings/temporary/active/', views.active_temp_listings),
    path('admin/unapproved-listings/', views.unapproved_listings),
    path('developer/pending/', views.pending_games),
    path('developer/games/', views.developer_games),
    path('developer/stats/', views.game_stats),
    path('reset-seed/', views.reset_seed_database),
    path('delete-account/', views.delete_my_account),
    path('update-profile/', views.update_profile),
    path('search-games/', views.search_games),
    path('admin/assign-user/', views.assign_user),
    path('admin/managed-users/', views.view_managed_users),
    path("admin/delete-user/", views.delete_managed_user),
    path('debug-dashboard/', views.debug_dashboard),
    path('all-game-listings/', views.all_game_listings),
    path('upload_game/', views.upload_game),
    path('approve-listing/', views.approve_pending_game),
    path('notifications/', views.get_notifications),
    path('notifications/clear/', views.clear_notifications),
    path('notifications/mark-read/', views.mark_notification_read),
    path("myprofile/update-password/", views.update_my_password),
    path("reject-listing/", views.reject_pending_game),
    path("delete-game/", views.delete_game),
    path('country-multiplier/', views.get_country_multiplier),
    path('myprofile/update-wallet/', views.update_wallet_balance),
    path("myprofile/update-country/", views.update_my_country),
]

urlpatterns += router.urls
