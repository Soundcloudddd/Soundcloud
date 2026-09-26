from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        NOT_SPECIFIED = "not_specified", "Prefer not to say"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=150)
    birth_date = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices)
