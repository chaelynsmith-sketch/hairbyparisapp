const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: String,
    recipientName: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true },
    firstName: String,
    lastName: String,
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    phone: { type: String, unique: true, sparse: true, trim: true, index: true },
    passwordHash: String,
    provider: { type: String, enum: ["local", "google", "apple"], default: "local" },
    role: { type: String, enum: ["customer", "admin", "super_admin"], default: "customer" },
    preferredLanguage: { type: String, default: "en" },
    country: { type: String, default: "ZA" },
    currency: { type: String, default: "ZAR" },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    loyaltyPoints: { type: Number, default: 0 },
    referralCode: { type: String, index: true },
    pushTokens: [
      {
        token: { type: String, required: true },
        platform: String,
        createdAt: { type: Date, default: Date.now },
        lastSeenAt: { type: Date, default: Date.now }
      }
    ],
    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    recoveryOtps: [
      {
        purpose: { type: String, enum: ["password_reset", "username_recovery"] },
        codeHash: String,
        destination: String,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    preferences: {
      hairGoals: [String],
      preferredCategories: [String],
      chatbotContext: {
        hairType: String,
        concerns: [String],
        budgetRange: String
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
