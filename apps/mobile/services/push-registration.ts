export async function registerDeviceForPushNotifications() {
  return {
    success: false,
    message: "Push registration requires a native development build. The backend push pipeline is ready."
  };
}
