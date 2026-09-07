from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Activity


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class ActivityApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='athlete', password='StrongPass123!')
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_activity_crud_recalculates_stats(self):
        create_response = self.client.post(
            '/api/activities/',
            {
                'activity_type': 'run',
                'duration_mins': 30,
                'distance_km': 5,
                'notes': 'Morning run',
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        activity_id = create_response.data['id']
        stats_response = self.client.get('/api/activities/stats/')
        self.assertEqual(stats_response.data['total_activities'], 1)
        self.assertEqual(stats_response.data['total_distance'], 5)

        update_response = self.client.put(
            f'/api/activities/{activity_id}/',
            {
                'activity_type': 'swim',
                'duration_mins': 20,
                'distance_km': 0.5,
                'notes': 'Pool session',
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        updated_stats = self.client.get('/api/activities/stats/')
        self.assertEqual(updated_stats.data['total_distance'], 0.5)

        delete_response = self.client.delete(f'/api/activities/{activity_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        final_stats = self.client.get('/api/activities/stats/')
        self.assertEqual(final_stats.data['total_activities'], 0)
        self.assertEqual(final_stats.data['total_distance'], 0)

    def test_users_can_only_access_their_own_activities(self):
        other_user = User.objects.create_user(username='other', password='StrongPass123!')
        other_activity = Activity.objects.create(
            user=other_user,
            activity_type='ride',
            duration_mins=40,
            distance_km=15,
        )

        list_response = self.client.get('/api/activities/')
        detail_response = self.client.get(f'/api/activities/{other_activity.id}/')

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data, [])
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_activity_validation_rejects_invalid_numbers(self):
        response = self.client.post(
            '/api/activities/',
            {
                'activity_type': 'run',
                'duration_mins': 0,
                'distance_km': -1,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('duration_mins', response.data)
        self.assertIn('distance_km', response.data)
