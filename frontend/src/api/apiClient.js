import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to attach JWT token and handle multipart
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ems_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If uploading FormData, delete fixed Content-Type so Axios/browser sets multipart boundary correctly
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle global errors and auth expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear on login or me check failures if intentionally handling
      const currentPath = window.location.pathname;
      if (!error.config.url.includes("/users/login") && !error.config.url.includes("/users/register")) {
        console.warn("Unauthorized request. Token may be expired.");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
