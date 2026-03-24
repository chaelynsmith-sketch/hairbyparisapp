const express = require("express");
const { authRouter } = require("./modules/auth.routes");
const { storeRouter } = require("./modules/store.routes");
const { productRouter } = require("./modules/product.routes");
const { cartRouter } = require("./modules/cart.routes");
const { orderRouter } = require("./modules/order.routes");
const { reviewRouter } = require("./modules/review.routes");
const { supplierRouter } = require("./modules/supplier.routes");
const { aiRouter } = require("./modules/ai.routes");
const { adminRouter } = require("./modules/admin.routes");
const { paymentRouter } = require("./modules/payment.routes");
const { notificationRouter } = require("./modules/notification.routes");
const { uploadRouter } = require("./modules/upload.routes");
const { policyRouter } = require("./modules/policy.routes");
const { payoutRouter } = require("./modules/payout.routes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/stores", storeRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/suppliers", supplierRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/policies", policyRouter);
apiRouter.use("/payouts", payoutRouter);

module.exports = { apiRouter };
