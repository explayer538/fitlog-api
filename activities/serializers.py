from rest_framework import serializers
from .models import Activity, UserStats

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'activity_type', 'duration_mins', 'distance_km', 'notes', 'logged_at']
        read_only_fields = ['logged_at']

class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = ['total_activities', 'total_distance', 'weekly_distance', 'current_streak', 'last_updated']
