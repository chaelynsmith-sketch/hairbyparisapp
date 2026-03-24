const { Review } = require("../models/review.model");
const { Order } = require("../models/order.model");
const { User } = require("../models/user.model");

async function listReviews(req, res) {
  const reviews = await Review.find({ productId: req.query.productId }).sort({ createdAt: -1 }).lean();
  const userIds = reviews.map((review) => review.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("firstName lastName").lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  res.json({
    reviews: reviews.map((review) => ({
      ...review,
      user: usersById.get(review.userId.toString()) || null
    }))
  });
}

async function createReview(req, res) {
  const purchase = await Order.findOne({
    userId: req.user.id,
    "items.productId": req.body.productId,
    status: { $in: ["paid", "processing", "shipped", "delivered"] }
  });

  const review = await Review.create({
    storeId: req.storeId,
    userId: req.user.id,
    productId: req.body.productId,
    orderId: purchase?.id,
    rating: req.body.rating,
    title: req.body.title,
    comment: req.body.comment,
    media: req.body.media || [],
    verifiedPurchase: Boolean(purchase)
  });

  res.status(201).json({ review });
}

module.exports = { listReviews, createReview };
