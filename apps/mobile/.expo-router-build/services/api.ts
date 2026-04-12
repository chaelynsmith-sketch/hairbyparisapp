import axios from "axios";
import Constants from "expo-constants";

import { useSessionStore } from "@/store/session-store";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const { accessToken, storeKey } = useSessionStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (storeKey) {
    config.headers["x-store-key"] = storeKey;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = error?.response?.data?.message || "";
    const status = error?.response?.status;
    const { refreshToken, setSession, clearSession } = useSessionStore.getState();

    if (
      status === 401 &&
      refreshToken &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/login") &&
      !originalRequest?.url?.includes("/auth/refresh") &&
      (message === "Access token expired" || message === "Authentication required")
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user
        });
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${data.accessToken}`
        };

        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
