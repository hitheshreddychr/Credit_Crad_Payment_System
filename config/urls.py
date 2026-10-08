from django.contrib import admin
from django.urls import include, path

from users.views import (
    LoginView,
    LogoutView,
    ProfileView,
    RegisterView,
)


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/auth/register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "api/auth/login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "api/auth/logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    path(
        "api/auth/profile/",
        ProfileView.as_view(),
        name="profile",
    ),

    path(
        "api/cards/",
        include("cards.urls"),
    ),

    path(
        "api/payments/",
        include("transactions.urls"),
    ),

    path(
        "api/admin/users/",
        include("users.admin_urls"),
    ),

    path(
        "api/admin/cards/",
        include("cards.admin_urls"),
    ),

    path(
        "api/statements/",
        include("statements.urls"),
    ),
]