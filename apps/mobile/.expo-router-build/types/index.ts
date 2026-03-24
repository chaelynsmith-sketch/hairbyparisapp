export type StorefrontProduct = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  media: { type: string; url: string; alt?: string }[];
  displayPrice: number;
  displayCurrency: string;
  pricing: {
    amount: number;
    saleAmount?: number;
    baseCurrency: string;
  };
  attributes?: {
    brand?: string;
    color?: string;
    length?: string;
    texture?: string;
    material?: string;
  };
  inventory: {
    sku: string;
    quantity: number;
  };
};

export type AppUser = {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role?: string;
  preferredLanguage: string;
  country: string;
  currency: string;
  loyaltyPoints: number;
};

export type CartItem = {
  productId: StorefrontProduct;
  quantity: number;
  unitPrice: number;
  currency: string;
};

export type Review = {
  _id: string;
  rating: number;
  title?: string;
  comment?: string;
  verifiedPurchase: boolean;
  media: { url: string; type: string }[];
  user?: {
    firstName?: string;
    lastName?: string;
  } | null;
  createdAt: string;
};

export type UploadedMedia = {
  url: string;
  key: string;
  type: string;
};
