from django.urls import path

from .admin_views import (
    AdminCardListView,
    AdminCardUpdateView,
)


urlpatterns = [
    path(
        "",
        AdminCardListView.as_view(),
        name="admin-card-list",
    ),
    path(
        "<int:card_id>/",
        AdminCardUpdateView.as_view(),
        name="admin-card-update",
    ),
]