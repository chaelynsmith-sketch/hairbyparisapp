const {
  sendPushNotification,
  sendCampaignNotification,
  listNotificationsForUser,
  markNotificationAsRead,
  registerPushToken
} = require("../services/notification.service");

async function sendNotification(req, res) {
  const result =
    req.body.audience === "all_customers"
      ? await sendCampaignNotification({
          storeId: req.storeId,
          audience: req.body.audience,
          title: req.body.title,
          body: req.body.body,
          data: req.body.data
        })
      : await sendPushNotification(req.body);
  res.json(result);
}

async function getMyNotifications(req, res) {
  const notifications = await listNotificationsForUser(req.user.id);
  res.json({ notifications });
}

async function markAsRead(req, res) {
  const notification = await markNotificationAsRead(req.params.notificationId, req.user.id);
  res.json({ notification });
}

async function savePushToken(req, res) {
  const result = await registerPushToken({
    userId: req.user.id,
    token: req.body.token,
    platform: req.body.platform
  });
  res.json(result);
}

module.exports = { sendNotification, getMyNotifications, markAsRead, savePushToken };
