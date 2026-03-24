const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { User } = require("../models/user.model");
const { Supplier } = require("../models/supplier.model");

async function dashboardSummary(req, res) {
  const [sales, totalOrders, users, products, suppliers, popularProducts] = await Promise.all([
    Order.aggregate([
      { $match: { storeId: req.store._id, status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, revenue: { $sum: "$totals.grandTotal" } } }
    ]),
    Order.countDocuments({ storeId: req.storeId }),
    User.countDocuments({ storeId: req.storeId }),
    Product.countDocuments({ storeId: req.storeId }),
    Supplier.countDocuments({ storeId: req.storeId }),
    Order.aggregate([
      { $match: { storeId: req.store._id } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", salesCount: { $sum: "$items.quantity" } } },
      { $sort: { salesCount: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    metrics: {
      revenue: sales[0]?.revenue || 0,
      totalOrders,
      users,
      products,
      suppliers
    },
    popularProducts
  });
}

module.exports = { dashboardSummary };
