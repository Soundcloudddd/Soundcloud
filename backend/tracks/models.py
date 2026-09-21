from django.conf import settings
from django.db import models
from .validators import validate_audio_file
from mutagen import File


class Track(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    artist = models.CharField(max_length=255)

    audio_file = models.FileField(
        upload_to="tracks/",
        validators=[validate_audio_file]
    )

    cover_image = models.ImageField(
        upload_to="covers/",
        blank=True,
        null=True
    )

    genre = models.CharField(max_length=100, blank=True)

    duration = models.PositiveIntegerField(default=0)

    plays = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)

    is_public = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.audio_file:
            try:
                self.audio_file.seek(0)
                audio = File(self.audio_file)

                if audio and hasattr(audio, "info"):
                    self.duration = int(audio.info.length)

                self.audio_file.seek(0)

            except Exception:
                pass

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.artist} - {self.title}"


class TrackLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='track_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'track')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} likes {self.track}"
