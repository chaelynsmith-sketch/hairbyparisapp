const { Notification } = require("../models/notification.model");
const { User } = require("../models/user.model");

async function sendExpoPushMessages(pushTokens, title, body, data = {}) {
  if (!pushTokens.length) {
    return { delivered: 0 };
  }

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    return { delivered: 0 };
  }

  return response.json();
}

async function sendPushNotification({ userId, title, body, data = {} }) {
  const notification = await Notification.create({
    userId,
    title,
    body,
    data,
    channel: "in_app"
  });

  const user = await User.findById(userId).select("pushTokens");
  const expoPushTokens = (user?.pushTokens || []).map((entry) => entry.token).filter(Boolean);
  await sendExpoPushMessages(expoPushTokens, title, body, data);

  return {
    delivered: true,
    userId,
    title,
    body,
    data,
    notificationId: notification.id
  };
}

async function sendBulkNotification({ userIds, title, body, data = {} }) {
  if (!userIds?.length) {
    return { delivered: true, count: 0, notificationIds: [] };
  }

  const notifications = await Notification.insertMany(
    userIds.map((userId) => ({
      userId,
      title,
      body,
      data,
      channel: "in_app"
    }))
  );

  const users = await User.find({ _id: { $in: userIds } }).select("pushTokens");
  const expoPushTokens = users.flatMap((user) => (user.pushTokens || []).map((entry) => entry.token).filter(Boolean));
  await sendExpoPushMessages(expoPushTokens, title, body, data);

  return {
    delivered: true,
    count: notifications.length,
    notificationIds: notifications.map((notification) => notification.id)
  };
}

async function sendCampaignNotification({ storeId, audience, title, body, data = {} }) {
  let filters = {};

  if (audience === "all_customers") {
    filters = { role: "customer", ...(storeId ? { storeId } : {}) };
  }

  let users = await User.find(filters).select("_id");

  if (!users.length && audience === "all_customers" && storeId) {
    users = await User.find({ role: "customer" }).select("_id");
  }

  return sendBulkNotification({
    userIds: users.map((user) => user.id),
    title,
    body,
    data
  });
}

async function listNotificationsForUser(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
}

async function markNotificationAsRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
}

async function registerPushToken({ userId, token, platform }) {
  await User.updateOne(
    { _id: userId, "pushTokens.token": token },
    {
      $set: {
        "pushTokens.$.lastSeenAt": new Date(),
        "pushTokens.$.platform": platform || "unknown"
      }
    }
  );

  await User.updateOne(
    { _id: userId, "pushTokens.token": { $ne: token } },
    {
      $push: {
        pushTokens: {
          token,
          platform: platform || "unknown"
        }
      }
    }
  );

  return { registered: true, token };
}

module.exports = {
  sendPushNotification,
  sendBulkNotification,
  sendCampaignNotification,
  listNotificationsForUser,
  markNotificationAsRead,
  registerPushToken
};
