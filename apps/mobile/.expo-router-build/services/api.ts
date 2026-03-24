import axios from "axios";
import Constants from "expo-constants";

import { useSessionStore } from "@/store/session-store";

const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    "http://localhost:4000/api/v1"
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

export { api };
