from rest_framework import serializers

from .models import Activity, UserStats


class ActivitySerializer(serializers.ModelSerializer):
    duration_mins = serializers.IntegerField(min_value=1)
    distance_km = serializers.FloatField(min_value=0, allow_null=True, required=False)

    class Meta:
        model = Activity
        fields = ['id', 'activity_type', 'duration_mins', 'distance_km', 'notes', 'logged_at']
        read_only_fields = ['logged_at']


class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = ['total_activities', 'total_distance', 'weekly_distance', 'current_streak', 'last_updated']
