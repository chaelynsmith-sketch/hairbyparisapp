import { api } from "@/services/api";

export async function fetchAdminDashboard() {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export async function fetchAdminProducts() {
  const { data } = await api.get("/admin/products");
  return data.products;
}

export async function sendCampaignNotification(payload: Record<string, unknown>) {
  const { data } = await api.post("/notifications", payload);
  return data;
}

export async function fetchAdminOrders() {
  const { data } = await api.get("/orders");
  return data.orders;
}

export async function updateAdminOrder(orderId: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/orders/${orderId}`, payload);
  return data.order;
}
