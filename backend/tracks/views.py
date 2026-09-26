import random
from django.db.models import Exists, F, OuterRef

from rest_framework import filters, viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response

from .models import Track, TrackLike
from .serializers import TrackSerializer


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    filter_backends = [filters.SearchFilter]
    permission_classes = [AllowAny]
    search_fields = ["title"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated:
            return queryset.annotate(
                liked=Exists(
                    TrackLike.objects.filter(
                        track_id=OuterRef("pk"),
                        user=user,
                    )
                )
            )

        return queryset

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="like")
    def like(self, request, pk=None):
        track = self.get_object()
        existing_like = track.track_likes.filter(user=request.user).first()
        if existing_like:
            existing_like.delete()
            Track.objects.filter(pk=track.pk, likes__gt=0).update(
                likes=F("likes") - 1
            )
            track.refresh_from_db()
            track.liked = False
            serializer = self.get_serializer(
                track,
                context=self.get_serializer_context(),
            )
            return Response(serializer.data)

        _, created = track.track_likes.get_or_create(user=request.user)
        if not created:
            return Response({"detail": "Ви вже лайкали цю пісню."}, status=status.HTTP_400_BAD_REQUEST)
        Track.objects.filter(pk=track.pk).update(likes=F("likes") + 1)
        track.refresh_from_db()
        track.liked = True
        serializer = self.get_serializer(track, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="recommendations",
    )
    def recommendations(self, request):
        """Recommend up to ten unliked public tracks from liked genres."""
        liked_genres = TrackLike.objects.filter(
            user=request.user,
            track__genre__gt="",
        ).values_list("track__genre", flat=True).distinct()

        recommendations = (
            self.get_queryset()
            .filter(genre__in=liked_genres)
            .exclude(track_likes__user=request.user)
            .order_by("-likes", "-created_at")[:10]
        )
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="next-track")
    def next_track(self, request):
        current_id = request.query_params.get("current_id")
        shuffle = request.query_params.get("shuffle") == "true"
        loop = request.query_params.get("loop") == "true"

        queryset = self.get_queryset().order_by("created_at")
        if not queryset.exists():
            return Response(status=204)

        if shuffle:
            next_track = random.choice(list(queryset))
        else:
            ids = list(queryset.values_list("id", flat=True))
            if current_id is None or int(current_id) not in ids:
                next_track = queryset.first()
            else:
                current_index = ids.index(int(current_id))
                next_index = current_index + 1

                if next_index >= len(ids):
                    if loop:
                        next_index = 0
                    else:
                        return Response(status=204)

                next_track = queryset[next_index]

        serializer = self.get_serializer(next_track)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="previous-track")
    def previous_track(self, request):
        current_id = request.query_params.get("current_id")
        shuffle = request.query_params.get("shuffle") == "true"
        loop = request.query_params.get("loop") == "true"

        queryset = self.get_queryset().order_by("created_at")
        if not queryset.exists():
            return Response(status=204)

        if shuffle:
            previous_track = random.choice(list(queryset))
        else:
            ids = list(queryset.values_list("id", flat=True))
            if current_id is None or int(current_id) not in ids:
                previous_track = queryset.last()
            else:
                current_index = ids.index(int(current_id))
                previous_index = current_index - 1

                if previous_index < 0:
                    if loop:
                        previous_index = len(ids) - 1
                    else:
                        return Response(status=204)

                previous_track = queryset[previous_index]

        serializer = self.get_serializer(previous_track)
        return Response(serializer.data)

    parser_classes = (
        MultiPartParser,
        FormParser,
    )
