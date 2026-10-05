from django.contrib.auth import get_user_model
from django.db import models

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from admin_logs.services import create_admin_log

from .serializers import UserSerializer


User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_admin
                or request.user.is_staff
            )
        )


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all().order_by(
            "-created_at"
        )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(
                    phone_number__icontains=search
                )
            )

        return queryset

    def list(self, request, *args, **kwargs):
        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description="Admin viewed registered users.",
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
        )

        return super().list(
            request,
            *args,
            **kwargs,
        )


class AdminUserUpdateView(
    generics.UpdateAPIView
):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["patch"]

    def get_queryset(self):
        return User.objects.all()

    def patch(self, request, *args, **kwargs):
        user = self.get_object()

        is_active = request.data.get(
            "is_active"
        )

        if is_active is None:
            return Response(
                {
                    "message": (
                        "is_active is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(is_active, bool):
            return Response(
                {
                    "message": (
                        "is_active must be true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = is_active
        user.save(
            update_fields=["is_active"]
        )

        create_admin_log(
            admin=request.user,
            action="UPDATE_USER",
            description=(
                f"Admin updated user "
                f"{user.username} active status "
                f"to {user.is_active}."
            ),
            ip_address=request.META.get(
                "REMOTE_ADDR"
            ),
        )

        return Response(
            {
                "message": (
                    "User status updated successfully."
                ),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )