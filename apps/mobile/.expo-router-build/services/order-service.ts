import { api } from "@/services/api";

export async function fetchOrders() {
  const { data } = await api.get("/orders");
  return data.orders;
}

export async function fetchCheckoutSummary(couponCode?: string) {
  const { data } = await api.get("/orders/checkout-summary", {
    params: { couponCode }
  });
  return data;
}

export async function fetchPaymentMethods(): Promise<string[]> {
  const { data } = await api.get("/payments/methods");
  return data.paymentMethods || [];
}

export async function placeOrder(payload: {
  paymentProvider: string;
  paymentMethodType?: string;
  forceDuplicate?: boolean;
  couponCode?: string;
  shippingAddress?: Record<string, unknown>;
}) {
  const { data } = await api.post("/orders", payload);
  return data;
}

export async function trackOrder(orderId: string) {
  const { data } = await api.get(`/orders/${orderId}/track`);
  return data.order;
}

export async function simulatePaymentUpdate(payload: {
  orderId: string;
  provider: string;
  status: "paid" | "failed" | "refunded";
}) {
  const { data } = await api.post("/payments/simulate", payload);
  return data.order;
}
