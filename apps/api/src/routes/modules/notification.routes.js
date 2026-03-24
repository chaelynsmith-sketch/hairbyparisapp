const express = require("express");
const { body } = require("express-validator");
const { sendNotification, getMyNotifications, markAsRead, savePushToken } = require("../../controllers/notification.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { validateRequest } = require("../../middleware/validate.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const notificationRouter = express.Router();

notificationRouter.get("/me", authenticate, asyncHandler(getMyNotifications));
notificationRouter.post(
  "/push-token",
  authenticate,
  [body("token").trim().notEmpty(), body("platform").optional().trim().isString()],
  validateRequest,
  asyncHandler(savePushToken)
);
notificationRouter.post("/:notificationId/read", authenticate, asyncHandler(markAsRead));
notificationRouter.post("/", authenticate, requireRole("admin", "super_admin"), asyncHandler(sendNotification));

module.exports = { notificationRouter };
