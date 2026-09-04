from rest_framework import serializers
from .models import Playlist
from tracks.serializers import TrackSerializer


class PlaylistSerializer(serializers.ModelSerializer):
    tracks = TrackSerializer(many=True, read_only=True)
    track_count = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ["id", "name", "description", "tracks", "track_count", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_track_count(self, obj):
        return obj.tracks.count()
