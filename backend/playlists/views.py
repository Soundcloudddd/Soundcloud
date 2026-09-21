from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Playlist
from .serializers import PlaylistSerializer
from tracks.models import Track


class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer

    @action(detail=True, methods=["post"])
    def add_track(self, request, pk=None):
        """Add a track to the playlist and return the updated playlist."""
        playlist = self.get_object()
        track_id = request.data.get("track_id")

        if not track_id:
            return Response(
                {"error": "track_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            track = Track.objects.get(pk=track_id)
        except Track.DoesNotExist:
            return Response(
                {"error": "track not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if playlist.tracks.filter(pk=track.pk).exists():
            return Response(
                {"error": "track is already in the playlist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        playlist.tracks.add(track)
        return Response(self.get_serializer(playlist).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def remove_track(self, request, pk=None):
        """Remove a track from the playlist"""
        playlist = self.get_object()
        track_id = request.data.get("track_id")
        
        if not track_id:
            return Response(
                {"error": "track_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            track = Track.objects.get(id=track_id)
            playlist.tracks.remove(track)
            return Response(
                {"status": "track removed"},
                status=status.HTTP_200_OK
            )
        except Track.DoesNotExist:
            return Response(
                {"error": "track not found"},
                status=status.HTTP_404_NOT_FOUND
            )
