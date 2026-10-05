import api from "../api";

export const loginUser = (data) =>
  api.post("/api/auth/login/", data);

export const registerUser = (data) =>
  api.post("/api/auth/register/", data);

export const logoutUser = (refresh) =>
  api.post("/api/auth/logout/", {
    refresh,
  });