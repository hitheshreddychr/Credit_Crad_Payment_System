import api from "../api";

export const getAdminSummary = () =>
  api.get("/api/payments/admin/summary/");

export const getAdminUsers = (search = "") =>
  api.get("/api/admin/users/", {
    params: search ? { search } : {},
  });

export const getAdminTransactions = () =>
  api.get("/api/payments/admin/transactions/");

export const updateUserStatus = (
  id,
  isActive
) =>
  api.patch(`/api/admin/users/${id}/`, {
    is_active: isActive,
  });

export const exportTransactions = () =>
  api.get(
    "/api/payments/admin/transactions/export/",
    {
      responseType: "blob",
    }
  );