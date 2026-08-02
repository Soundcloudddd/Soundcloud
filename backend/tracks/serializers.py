from rest_framework import serializers
from .models import Track


class TrackSerializer(serializers.ModelSerializer):
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