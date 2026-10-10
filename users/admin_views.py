from django.contrib.auth import get_user_model
from django.db import models

from rest_framework import generics, status
from rest_framework.response import Response

from admin_logs.services import create_admin_log
from .permissions import IsSystemAdmin
from .serializers import UserSerializer


User = get_user_model()


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")

        search = self.request.query_params.get("search")

        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(phone_number__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        create_admin_log(
            admin=request.user,
            action="VIEW_TRANSACTION",
            description="Admin viewed registered users.",
            ip_address=get_client_ip(request),
        )

        return super().list(request, *args, **kwargs)


class AdminUserUpdateView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin]
    http_method_names = ["patch"]

    def get_queryset(self):
        return User.objects.all()

    def patch(self, request, *args, **kwargs):
        unexpected_fields = set(request.data.keys()) - {"is_active"}

        if unexpected_fields:
            return Response(
                {"message": "Only is_active can be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = self.get_object()
        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"message": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.pk == request.user.pk and not is_active:
            return Response(
                {"message": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        previous_status = user.is_active
        user.is_active = is_active
        user.save(update_fields=["is_active"])

        if previous_status != is_active:
            create_admin_log(
                admin=request.user,
                action="UPDATE_USER",
                description=(
                    f"Admin changed user {user.username} "
                    f"active status from {previous_status} "
                    f"to {is_active}."
                ),
                ip_address=get_client_ip(request),
            )

        return Response(
            {
                "message": "User status updated successfully.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )
