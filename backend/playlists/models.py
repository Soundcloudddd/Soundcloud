from django.db import models
from tracks.models import Track


class Playlist(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    tracks = models.ManyToManyField(Track, related_name="playlists", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
