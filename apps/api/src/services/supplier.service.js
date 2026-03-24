const nodemailer = require("nodemailer");
const { Supplier } = require("../models/supplier.model");

async function dispatchOrderToSupplier(order) {
  const suppliers = await Supplier.find({
    _id: { $in: order.items.map((item) => item.supplierId).filter(Boolean) }
  });

  const transporter =
    process.env.SMTP_HOST && process.env.SMTP_USER
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
      : null;

  const results = [];

  for (const supplier of suppliers) {
    const orderItems = order.items.filter(
      (item) => item.supplierId?.toString() === supplier.id
    );

    if (supplier.mode === "api" && supplier.apiEndpoint) {
      results.push({
        supplier: supplier.name,
        mode: supplier.mode,
        status: "queued_for_api_dispatch",
        payload: {
          orderNumber: order.orderNumber,
          items: orderItems
        }
      });
      continue;
    }

    if (supplier.mode === "email" && supplier.email && transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: supplier.email,
        subject: `New order ${order.orderNumber}`,
        text: JSON.stringify({ orderNumber: order.orderNumber, items: orderItems }, null, 2)
      });
      results.push({ supplier: supplier.name, mode: supplier.mode, status: "emailed" });
      continue;
    }

    results.push({ supplier: supplier.name, mode: "manual", status: "manual_action_required" });
  }

  return results;
}

module.exports = { dispatchOrderToSupplier };
