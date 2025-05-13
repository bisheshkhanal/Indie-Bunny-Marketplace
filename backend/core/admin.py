from django.contrib import admin
from .models import (
    User, Developer, Player, Admin as AdminModel, Game, GameListing,
    RegularListing, TemporaryListing, Purchase, BUYS, MysteryPool, RECEIVES,
    Wishlist, WishlistEntries, Tip, Notification, MANAGES, APPROVES
)

models = [
    User, Developer, Player, AdminModel, Game, GameListing,
    RegularListing, TemporaryListing, Purchase, BUYS, MysteryPool, RECEIVES,
    Wishlist, WishlistEntries, Tip, Notification, MANAGES, APPROVES
]

for model in models:
    admin.site.register(model)
