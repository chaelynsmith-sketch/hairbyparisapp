const { PolicyPage } = require("../models/policy-page.model");

const defaultPolicies = {
  privacy: {
    key: "privacy",
    title: "Privacy policy",
    subtitle: "How Hair By Paris collects, uses, and protects customer information.",
    sections: [
      {
        title: "What we collect",
        body: "Hair By Paris collects the information needed to run the store, including your name, email address, phone number, shipping details, order history, and saved preferences."
      },
      {
        title: "How we use it",
        body: "We use your information to process orders, send recovery OTPs and notifications, support deliveries, prevent fraud, and improve the shopping experience."
      },
      {
        title: "Payments and security",
        body: "Card and wallet payments are intended to be processed through approved payment providers. Hair By Paris should not store raw card details directly in the app backend."
      },
      {
        title: "Sharing",
        body: "We may share the minimum information required with suppliers, delivery partners, and payment providers to fulfill your order and support customer service."
      },
      {
        title: "Your choices",
        body: "You can review account details in the app, manage notifications, and contact support to request updates or deletion where legally allowed."
      }
    ]
  },
  terms: {
    key: "terms",
    title: "Terms and conditions",
    subtitle: "The main rules for using Hair By Paris and placing orders.",
    sections: [
      {
        title: "Using the app",
        body: "By using Hair By Paris, you agree to provide accurate account, shipping, and payment information and to use the platform only for lawful shopping and account activity."
      },
      {
        title: "Orders",
        body: "Orders are subject to availability, payment verification, supplier fulfillment, and shipping review. Hair By Paris may cancel or refuse orders affected by fraud, stock issues, or pricing errors."
      },
      {
        title: "Accounts",
        body: "You are responsible for protecting your sign-in credentials and for any activity carried out through your account until you notify support of misuse."
      },
      {
        title: "Content and reviews",
        body: "Customer reviews, uploads, and other submitted content must be lawful, accurate, and non-abusive. Hair By Paris may remove content that violates store standards."
      },
      {
        title: "Changes",
        body: "Hair By Paris may update product details, operational policies, and app features over time. Continued use of the app means you accept the current terms."
      }
    ]
  },
  refunds: {
    key: "refunds",
    title: "Refund policy",
    subtitle: "How Hair By Paris handles refunds, delivery issues, and support review.",
    sections: [
      {
        title: "Refund eligibility",
        body: "Refund requests depend on the product type, the delivery condition, and whether the item is unused or defective. Hygiene-sensitive beauty and hair products may be restricted once opened or worn."
      },
      {
        title: "Late or failed delivery",
        body: "If an order misses its guaranteed delivery window, Hair By Paris may review the order for compensation, refund, replacement, or another support resolution."
      },
      {
        title: "Damaged or incorrect items",
        body: "Customers should report damaged, missing, or incorrect items as soon as possible with order details and supporting photos where relevant."
      },
      {
        title: "Refund timing",
        body: "Approved refunds are generally returned through the original payment channel. Processing times depend on the payment provider and bank."
      },
      {
        title: "Contact and review",
        body: "Refund and return cases may require manual review by support or admin staff before a final decision is made."
      }
    ]
  }
};

async function getPolicyPage(req, res) {
  const key = req.params.policyKey;
  const defaultPolicy = defaultPolicies[key];
  const storedPolicy = await PolicyPage.findOne({ key }).lean();

  res.json({ policy: storedPolicy || defaultPolicy || null });
}

async function upsertPolicyPage(req, res) {
  const key = req.params.policyKey;
  const defaultPolicy = defaultPolicies[key];

  const policy = await PolicyPage.findOneAndUpdate(
    { key },
    {
      key,
      title: req.body.title || defaultPolicy?.title || key,
      subtitle: req.body.subtitle || defaultPolicy?.subtitle || "",
      sections: req.body.sections || defaultPolicy?.sections || []
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ policy });
}

module.exports = { getPolicyPage, upsertPolicyPage, defaultPolicies };
