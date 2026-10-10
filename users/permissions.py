from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_admin:
            return True

        if user.is_staff and not user.role:
            return True

        return user.role in self.allowed_roles


class IsSystemAdmin(HasRole):
    allowed_roles = ("ADMIN",)


class IsSupport(HasRole):
    allowed_roles = ("ADMIN", "SUPPORT")


class IsReadOnly(HasRole):
    allowed_roles = ("ADMIN", "SUPPORT", "READ_ONLY")


class IsAdminOrReadOnly(HasRole):
    allowed_roles = ("ADMIN", "READ_ONLY")

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_admin:
            return True

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return user.role in (
                "ADMIN",
                "SUPPORT",
                "READ_ONLY",
            )

        return user.role == "ADMIN"
