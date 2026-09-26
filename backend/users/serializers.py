from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(max_length=150, required=False)
    birth_date = serializers.DateField(required=False)
    gender = serializers.ChoiceField(
        choices=UserProfile.Gender.values,
        required=False,
    )
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )

    password_confirm = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "password",
            "password_confirm",
            "display_name",
            "birth_date",
            "gender",
        )

    def validate_email(self, email):
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Користувач із таким email вже існує."
            )

        return email.lower()

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm": "Паролі не співпадають."
            })

        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")

        display_name = validated_data.pop("display_name", "")
        birth_date = validated_data.pop("birth_date", None)
        gender = validated_data.pop("gender", "")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        if display_name and birth_date and gender:
            UserProfile.objects.create(
                user=user,
                display_name=display_name,
                birth_date=birth_date,
                gender=gender,
            )

        return user
