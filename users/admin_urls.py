from django.urls import path

from .admin_views import (
    AdminUserListView,
    AdminUserUpdateView,
)


urlpatterns = [
    path(
        "",
        AdminUserListView.as_view(),
        name="admin-user-list",
    ),

    path(
        "<int:pk>/",
        AdminUserUpdateView.as_view(),
        name="admin-user-update",
    ),
]