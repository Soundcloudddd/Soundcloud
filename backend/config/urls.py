from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from users.views import RegisterView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    path(
    "api/auth/register/",
    RegisterView.as_view(),
    name="register",
),
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "api/auth/token/verify/",
        TokenVerifyView.as_view(),
        name="token_verify",
    ),

    path("api/", include("tracks.urls")),
    path("api/", include("playlists.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )