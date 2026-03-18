from django.urls import path
from .views import ActivityListCreateView, ActivityDetailView, UserStatsView

urlpatterns = [
    path('', ActivityListCreateView.as_view(), name='activity-list'),
    path('<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('stats/', UserStatsView.as_view(), name='user-stats'),
]
