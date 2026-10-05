import api from "../api";

export const getTransactions = () =>
  api.get("/api/payments/history/");