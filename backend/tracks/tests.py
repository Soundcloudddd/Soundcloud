from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Track, TrackLike


class TrackLikeTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="listener",
            password="test-password-123",
        )
        self.track = Track.objects.create(
            title="Test track",
            artist="Test artist",
            audio_file="tracks/test.mp3",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_second_like_request_removes_the_like(self):
        url = f"/api/tracks/{self.track.pk}/like/"

        first_response = self.client.post(url)
        second_response = self.client.post(url)

        self.track.refresh_from_db()
        self.assertEqual(first_response.status_code, 200)
        self.assertTrue(first_response.data["liked"])
        self.assertEqual(second_response.status_code, 200)
        self.assertFalse(second_response.data["liked"])
        self.assertEqual(self.track.likes, 0)
        self.assertEqual(TrackLike.objects.filter(track=self.track, user=self.user).count(), 0)

    def test_track_list_marks_liked_tracks_for_current_user(self):
        TrackLike.objects.create(track=self.track, user=self.user)

        response = self.client.get("/api/tracks/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data[0]["liked"])

    def test_recommendations_use_liked_track_genres_and_exclude_liked_tracks(self):
        recommended_track = Track.objects.create(
            title="Another rock track",
            artist="Rock artist",
            genre="rock",
            audio_file="tracks/rock.mp3",
        )
        other_genre_track = Track.objects.create(
            title="Jazz track",
            artist="Jazz artist",
            genre="jazz",
            audio_file="tracks/jazz.mp3",
        )
        self.track.genre = "rock"
        self.track.save()
        TrackLike.objects.create(track=self.track, user=self.user)

        response = self.client.get("/api/tracks/recommendations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [recommended_track.id])
        self.assertNotIn(other_genre_track.id, [item["id"] for item in response.data])
