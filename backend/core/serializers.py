from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class DeveloperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Developer
        fields = '__all__'

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = '__all__'

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'

class GameListingSerializer(serializers.ModelSerializer):
    game_title = serializers.CharField(source='game.title')
    developer = serializers.CharField(source='game.developer.email')
    genre = serializers.CharField(source='game.genre')
    image_url = serializers.CharField(source='game.image_url', allow_blank=True, allow_null=True)
    is_temporary = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = GameListing
        fields = [
            'id', 'game_title', 'developer', 'genre', 'image_url',
            'price', 'region_adjustment', 'is_temporary', 'discount_percent'
        ]

    def get_is_temporary(self, obj):
        return hasattr(obj, 'temporarylisting')


    def get_discount_percent(self, obj):
        temporary = getattr(obj, 'temporarylisting', None)
        return getattr(temporary, 'discount_percent', None)



class RegularListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegularListing
        fields = '__all__'

class TemporaryListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporaryListing
        fields = '__all__'

class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'

class BUYS_Serializer(serializers.ModelSerializer):
    class Meta:
        model = BUYS
        fields = '__all__'

class MysteryPoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = MysteryPool
        fields = '__all__'

class RECEIVESSerializer(serializers.ModelSerializer):
    class Meta:
        model = RECEIVES
        fields = '__all__'

class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = '__all__'

class WishlistEntriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistEntries
        fields = '__all__'

class TipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tip
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class MANAGESSerializer(serializers.ModelSerializer):
    class Meta:
        model = MANAGES
        fields = '__all__'

class APPROVESSerializer(serializers.ModelSerializer):
    class Meta:
        model = APPROVES
        fields = '__all__'