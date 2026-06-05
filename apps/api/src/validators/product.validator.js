const { body, query } = require("express-validator");

const productCreateValidator = [
  body("name").notEmpty(),
  body("slug").optional({ checkFalsy: true }).isString(),
  body("category").trim().notEmpty(),
  body("pricing.amount").isFloat({ min: 0 }),
  body("inventory.sku").optional({ checkFalsy: true }).isString()
];

const productQueryValidator = [
  query("category").optional().isString(),
  query("search").optional().isString(),
  query("featured").optional().isBoolean()
];

module.exports = { productCreateValidator, productQueryValidator };
