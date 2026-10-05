import axios from "axios";


const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/api/auth/login/",
      "/api/auth/register/",
    ];

    const isPublicEndpoint =
      publicEndpoints.includes(config.url);

    if (!isPublicEndpoint) {
      const token = localStorage.getItem(
        "access_token"
      );

      if (
        token &&
        token !== "[object Object]" &&
        typeof token === "string"
      ) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.url !== "/api/auth/login/"
    ) {
      localStorage.removeItem(
        "access_token"
      );

      localStorage.removeItem(
        "refresh_token"
      );

      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);


export default api;