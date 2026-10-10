
import api from "../api";

export const getAdminSummary = () =>
  api.get("/api/payments/admin/summary/");

export const getAdminUsers = (search = "") =>
  api.get("/api/admin/users/", {
    params: search ? { search } : {},
  });

export const getAdminTransactions = (params = {}) =>
  api.get("/api/payments/admin/transactions/", { params });

export const getAdminAnalytics = (params = {}) =>
  api.get("/api/payments/admin/analytics/", { params });

export const getAdminSystemHealth = () =>
  api.get("/api/payments/admin/system-health/");

export const updateUserStatus = (id, isActive) =>
  api.patch(`/api/admin/users/${id}/`, {
    is_active: isActive,
  });

export const exportTransactions = (params = {}) =>
  api.get("/api/payments/admin/transactions/export/", {
    params,
    responseType: "blob",
  });

export const exportAnalyticsCSV = (params = {}) =>
  api.get("/api/payments/admin/analytics/export/csv/", {
    params,
    responseType: "blob",
  });

export const exportAnalyticsPDF = (params = {}) =>
  api.get("/api/payments/admin/analytics/export/pdf/", {
    params,
    responseType: "blob",
  });
