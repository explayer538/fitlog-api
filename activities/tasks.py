from celery import shared_task
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Activity, UserStats

@shared_task
def recalculate_user_stats(user_id):
    user = User.objects.get(id=user_id)
    activities = Activity.objects.filter(user=user)

    # Total activities count
    total_activities = activities.count()

    # Total distance across all activities
    total_distance = sum(a.distance_km for a in activities if a.distance_km)

    # Weekly distance - only activities in last 7 days
    one_week_ago = timezone.now() - timedelta(days=7)
    weekly_activities = activities.filter(logged_at__gte=one_week_ago)
    weekly_distance = sum(a.distance_km for a in weekly_activities if a.distance_km)

    # Current streak - count consecutive days with at least one activity
    streak = 0
    check_date = timezone.now().date()
    while True:
        if activities.filter(logged_at__date=check_date).exists():
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Save everything to UserStats
    stats, created = UserStats.objects.get_or_create(user=user)
    stats.total_activities = total_activities
    stats.total_distance = total_distance
    stats.weekly_distance = weekly_distance
    stats.current_streak = streak
    stats.save()

    return f"Stats updated for {user.username}"
