from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Track
from .serializers import TrackSerializer


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer

    parser_classes = (
        MultiPartParser,
        FormParser,
    )