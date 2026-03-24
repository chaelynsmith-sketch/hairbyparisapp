import { api } from "@/services/api";

export async function fetchMyNotifications() {
  const { data } = await api.get("/notifications/me");
  return data.notifications;
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await api.post(`/notifications/${notificationId}/read`);
  return data.notification;
}

export { registerDeviceForPushNotifications } from "@/services/push-registration";
