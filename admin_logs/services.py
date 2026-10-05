from .models import AdminLog


def create_admin_log(
    admin,
    action,
    description="",
    ip_address=None,
):
    return AdminLog.objects.create(
        admin=admin,
        action=action,
        description=description,
        ip_address=ip_address,
    )