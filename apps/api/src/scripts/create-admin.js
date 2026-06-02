const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { Store } = require("../models/store.model");
const { User } = require("../models/user.model");

const adminEmail = process.env.ADMIN_EMAIL || "owner@hairbyparis.co.za";
const adminPhone = process.env.ADMIN_PHONE || "+27810000000";
const adminUsername = process.env.ADMIN_USERNAME || "parisowner";
const adminPassword = process.env.ADMIN_PASSWORD || "ParisAdmin2026!";

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const store = (await Store.findOne({ slug: "hair-by-paris-global" })) || (await Store.findOne());

  if (!store) {
    throw new Error("No store found. Start the API once to seed the store before creating an admin.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const user = await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase().trim() },
    {
      $set: {
        storeId: store._id,
        firstName: "Hair by Paris",
        lastName: "Owner",
        username: adminUsername.toLowerCase().trim(),
        email: adminEmail.toLowerCase().trim(),
        phone: adminPhone,
        passwordHash,
        provider: "local",
        role: "super_admin",
        preferredLanguage: "en",
        country: "ZA",
        currency: "ZAR",
        verification: {
          emailVerified: true,
          phoneVerified: true,
          activatedAt: new Date()
        }
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log("Admin account ready");
  console.log(`Email: ${user.email}`);
  console.log(`Username: ${user.username}`);
  console.log(`Phone: ${user.phone}`);
  console.log(`Role: ${user.role}`);
}

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
