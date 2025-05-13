from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=[('Player', 'Player'), ('Developer', 'Developer'), ('Admin', 'Admin')])
    is_active = models.BooleanField(default=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    country = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name

class Developer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    portfolio_link = models.URLField(max_length=255)

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    play_history = models.TextField(blank=True)
    

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    access_level = models.CharField(max_length=50)

class Game(models.Model):
    developer = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    description = models.TextField()
    genre = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    upload_date = models.DateField()
    min_tip_required = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image_url = models.URLField(blank=True, null=True)

class GameListing(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    upload_date = models.DateField()
    region_adjustment = models.CharField(max_length=100)

class RegularListing(models.Model):
    listing = models.OneToOneField(GameListing, on_delete=models.CASCADE, primary_key=True)

class TemporaryListing(models.Model):
    listing = models.OneToOneField(GameListing, on_delete=models.CASCADE, primary_key=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

class Purchase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

class BUYS(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE)
    listing = models.ForeignKey(GameListing, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('user', 'purchase', 'listing'),)

class MysteryPool(models.Model):
    entry_date = models.DateField()
    revenue_split = models.DecimalField(max_digits=5, decimal_places=2)

class RECEIVES(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    pool = models.ForeignKey(MysteryPool, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('user', 'game', 'pool'),)

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    added_date = models.DateField()

class WishlistEntries(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE)
    listing = models.ForeignKey(GameListing, on_delete=models.CASCADE)
    added_date = models.DateField()

class Tip(models.Model):
    giver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_tips')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_tips')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class MANAGES(models.Model):
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('admin', 'user'),)

class APPROVES(models.Model):
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)
    listing = models.ForeignKey(GameListing, on_delete=models.CASCADE)

    class Meta:
        unique_together = (('admin', 'listing'),)
        
class PendingGame(models.Model):
    developer = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    genre = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_tip_required = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    region_adjustment = models.CharField(max_length=100, default="Global")
    image_url = models.URLField(blank=True, null=True)
    upload_date = models.DateTimeField(auto_now_add=True)

    is_temporary = models.BooleanField(default=False)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} (Pending)"

    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)  
    target_url = models.CharField(max_length=255, blank=True, null=True)  
    

class CountryPricing(models.Model):
    country = models.CharField(max_length=100, unique=True)
    price_multiplier = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)  

