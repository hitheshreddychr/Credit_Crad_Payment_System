import api from "../api";

export const processPayment = (data) =>
  api.post("/api/payments/process/", data);

export const getPaymentHistory = () =>
  api.get("/api/payments/history/");