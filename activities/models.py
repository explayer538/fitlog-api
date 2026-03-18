from django.db import models
from django.contrib.auth.models import User

class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('run', 'Run'),
        ('lift', 'Lift'),
        ('ride', 'Ride'),
        ('swim', 'Swim'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=10, choices=ACTIVITY_TYPES)
    duration_mins = models.PositiveIntegerField()
    distance_km = models.FloatField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.logged_at.date()}"


class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    total_activities = models.PositiveIntegerField(default=0)
    total_distance = models.FloatField(default=0.0)
    weekly_distance = models.FloatField(default=0.0)
    current_streak = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} stats"
