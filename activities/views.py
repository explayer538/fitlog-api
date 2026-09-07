from rest_framework import generics, permissions

from .models import Activity, UserStats
from .serializers import ActivitySerializer, UserStatsSerializer
from .tasks import recalculate_user_stats


class ActivityListCreateView(generics.ListCreateAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(user=self.request.user).order_by('-logged_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        recalculate_user_stats.delay(self.request.user.id)


class ActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()
        recalculate_user_stats.delay(self.request.user.id)

    def perform_destroy(self, instance):
        user_id = self.request.user.id
        instance.delete()
        recalculate_user_stats.delay(user_id)


class UserStatsView(generics.RetrieveAPIView):
    serializer_class = UserStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        stats, created = UserStats.objects.get_or_create(user=self.request.user)
        return stats
