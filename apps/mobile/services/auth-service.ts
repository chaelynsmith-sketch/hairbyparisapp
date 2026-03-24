import { api } from "@/services/api";

export async function login(identifier: string, password: string) {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data;
}

export async function register(payload: {
  username: string;
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  storeSlug: string;
  country: string;
  currency: string;
  preferredLanguage: string;
}) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function requestPasswordOtp(identifier: string) {
  const { data } = await api.post("/auth/password/request-otp", { identifier });
  return data;
}

export async function resetPassword(payload: { identifier: string; otp: string; newPassword: string }) {
  const { data } = await api.post("/auth/password/reset", payload);
  return data;
}

export async function requestUsernameOtp(payload: { destination: string; destinationType: "email" | "phone" }) {
  const { data } = await api.post("/auth/username/request-otp", payload);
  return data;
}

export async function recoverUsername(payload: { destination: string; destinationType: "email" | "phone"; otp: string }) {
  const { data } = await api.post("/auth/username/recover", payload);
  return data;
}
