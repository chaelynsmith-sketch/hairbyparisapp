const { Store } = require("../models/store.model");
const { Product } = require("../models/product.model");
const { logger } = require("../config/logger");

const demoProducts = [
  {
    category: "Hair Extensions",
    name: "Brazilian Body Wave Bundle Set",
    slug: "brazilian-body-wave-bundle-set",
    description:
      "Soft premium body wave bundles with full volume, natural shine, and long-lasting styling flexibility.",
    tags: ["bundles", "body wave", "premium"],
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        alt: "Brazilian body wave bundles"
      }
    ],
    pricing: {
      baseCurrency: "ZAR",
      amount: 1899,
      saleAmount: 1699
    },
    inventory: {
      sku: "HBP-BW-001",
      quantity: 24,
      lowStockThreshold: 4
    },
    attributes: {
      brand: "Hair By Paris",
      color: "Natural Black",
      length: "22, 24, 26",
      texture: "Body Wave",
      material: "Human Hair"
    },
    recommendationSignals: {
      hairTypes: ["Relaxed", "Natural", "Protective Styles"],
      useCases: ["Everyday glam", "Install", "Volume"]
    },
    featured: true
  },
  {
    category: "Wigs",
    name: "HD Lace Straight Wig",
    slug: "hd-lace-straight-wig",
    description:
      "Pre-plucked HD lace wig with a sleek straight finish designed for a seamless melt and easy daily wear.",
    tags: ["wig", "lace", "straight"],
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
        alt: "HD lace straight wig"
      }
    ],
    pricing: {
      baseCurrency: "ZAR",
      amount: 3299,
      saleAmount: 2999
    },
    inventory: {
      sku: "HBP-WG-002",
      quantity: 12,
      lowStockThreshold: 3
    },
    attributes: {
      brand: "Hair By Paris",
      color: "Jet Black",
      length: "28",
      texture: "Straight",
      material: "Human Hair"
    },
    recommendationSignals: {
      hairTypes: ["All"],
      useCases: ["Protective styles", "Events", "Low maintenance"]
    },
    featured: true
  },
  {
    category: "Hair Products",
    name: "Nourish & Seal Growth Oil",
    slug: "nourish-seal-growth-oil",
    description:
      "Lightweight botanical oil blend for scalp comfort, braid maintenance, and moisture sealing without heavy buildup.",
    tags: ["oil", "scalp care", "growth"],
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
        alt: "Hair growth oil bottle"
      }
    ],
    pricing: {
      baseCurrency: "ZAR",
      amount: 249
    },
    inventory: {
      sku: "HBP-HP-003",
      quantity: 60,
      lowStockThreshold: 10
    },
    attributes: {
      brand: "Hair By Paris",
      material: "Botanical Blend"
    },
    recommendationSignals: {
      hairTypes: ["Dry scalp", "Protective Styles", "Natural"],
      useCases: ["Scalp care", "Moisture", "Maintenance"]
    },
    featured: false
  },
  {
    category: "Tools",
    name: "Ceramic Edge Styling Tool",
    slug: "ceramic-edge-styling-tool",
    description:
      "Compact beauty tool for smoothing edges, touch-up styling, and finishing installs with controlled heat.",
    tags: ["tool", "styling", "ceramic"],
    media: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
        alt: "Ceramic edge styling tool"
      }
    ],
    pricing: {
      baseCurrency: "ZAR",
      amount: 699
    },
    inventory: {
      sku: "HBP-TL-004",
      quantity: 18,
      lowStockThreshold: 5
    },
    attributes: {
      brand: "Hair By Paris",
      material: "Ceramic"
    },
    recommendationSignals: {
      hairTypes: ["All"],
      useCases: ["Styling", "Edges", "Travel kit"]
    },
    featured: true
  }
];

async function seedDevelopmentData() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  let store = await Store.findOne({ slug: "hair-by-paris-global" });

  if (!store) {
    store = await Store.create({
      name: "Hair By Paris Global",
      slug: "hair-by-paris-global",
      region: "Global",
      country: "ZA",
      defaultCurrency: "ZAR",
      locales: ["en", "fr"],
      branding: {
        primaryColor: "#C67658",
        accentColor: "#F7C9B6"
      },
      shippingConfig: {
        freeShippingThreshold: 1500,
        standardDeliveryDays: { min: 3, max: 7 },
        expressDeliveryDays: { min: 1, max: 3 }
      },
      paymentMethods: {
        stripe: true,
        paypal: true,
        payfast: true,
        ozow: true
      }
    });
    logger.info({ storeId: store.id }, "Created development store seed");
  }

  const existingCount = await Product.countDocuments({ storeId: store.id });
  if (existingCount > 0) {
    return;
  }

  await Product.insertMany(
    demoProducts.map((product) => ({
      ...product,
      storeId: store.id
    }))
  );

  logger.info({ storeId: store.id, count: demoProducts.length }, "Seeded development products");
}

module.exports = { seedDevelopmentData };
