from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_register_login_and_refresh_flow(self):
        register_response = self.client.post(
            '/api/auth/register/',
            {
                'username': 'newathlete',
                'email': 'athlete@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username='newathlete')
        self.assertTrue(user.check_password('StrongPass123!'))

        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'newathlete', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)
        self.assertIn('refresh', login_response.data)

        refresh_response = self.client.post(
            '/api/auth/token/refresh/',
            {'refresh': login_response.data['refresh']},
            format='json',
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

    def test_registration_validates_email_and_password(self):
        response = self.client.post(
            '/api/auth/register/',
            {'username': 'newathlete', 'email': 'not-an-email', 'password': 'short'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('password', response.data)
