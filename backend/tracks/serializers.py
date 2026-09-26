from rest_framework import serializers
from .models import Track


class TrackSerializer(serializers.ModelSerializer):
    liked = serializers.SerializerMethodField()

    def get_liked(self, track):
        """Whether the authenticated user has already liked this track."""
        return bool(getattr(track, "liked", False))

    class Meta:
        model = Track
        fields = "__all__"
        read_only_fields = [
            "id",
            "duration",
            "plays",
            "likes",
            "created_at",
            "updated_at",
        ]
