import os

from django.core.exceptions import ValidationError
from mutagen import File

ALLOWED_EXTENSIONS = [".mp3", ".wav", ".flac"]


def validate_audio_file(file):
    extension = os.path.splitext(file.name)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    try:
        audio = File(file)
        file.seek(0)

        if audio is None:
            raise ValidationError("Invalid audio file.")
    except Exception:
        raise ValidationError("Invalid audio file.")