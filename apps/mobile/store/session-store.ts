import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeOption } from "@/constants/theme";
import { AppUser, CartItem, StorefrontProduct } from "@/types";

const zustandMiddleware = require("zustand/middleware") as typeof import("zustand/middleware");
const { createJSONStorage, persist } = zustandMiddleware;
type StateStorage = import("zustand/middleware").StateStorage;

const SESSION_STORAGE_KEY = "hair-by-paris-session";
const defaultCountry = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || "ZA";
const defaultLocale = process.env.EXPO_PUBLIC_DEFAULT_LOCALE || "en";
const stateStorage: StateStorage = AsyncStorage;

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AppUser | null;
  rememberedIdentifier: string;
  storeKey: string;
  country: string;
  currency: string;
  locale: string;
  themePreference: ThemeOption;
  wishlist: string[];
  cartCount: number;
  guestCart: CartItem[];
  savedShippingAddress: {
    recipientName: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  } | null;
  recommendations: StorefrontProduct[];
  hasHydrated: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; user: AppUser }) => void;
  clearSession: () => void;
  setRememberedIdentifier: (identifier: string) => void;
  setRegion: (payload: { storeKey: string; country: string; currency: string; locale: string }) => void;
  setThemePreference: (themePreference: ThemeOption) => void;
  setWishlist: (wishlist: string[]) => void;
  toggleWishlistItem: (productId: string) => void;
  setCartCount: (count: number) => void;
  setGuestCart: (items: CartItem[]) => void;
  addGuestCartItem: (product: StorefrontProduct, quantity?: number) => void;
  updateGuestCartItemQuantity: (productId: string, quantity: number) => void;
  removeGuestCartItem: (productId: string) => void;
  setSavedShippingAddress: (address: SessionState["savedShippingAddress"]) => void;
  setRecommendations: (items: StorefrontProduct[]) => void;
  markHydrated: (value: boolean) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      rememberedIdentifier: "",
      storeKey: "hair-by-paris-global",
      country: defaultCountry,
      currency: "ZAR",
      locale: defaultLocale,
      themePreference: "black_white",
      wishlist: [],
      cartCount: 0,
      guestCart: [],
      savedShippingAddress: null,
      recommendations: [],
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user,
          currency: user.currency,
          locale: user.preferredLanguage,
          country: user.country
        }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          recommendations: [],
          storeKey: "hair-by-paris-global",
          country: defaultCountry,
          currency: "ZAR",
          locale: defaultLocale,
          themePreference: "black_white",
          savedShippingAddress: null
        }),
      setRememberedIdentifier: (rememberedIdentifier) => set({ rememberedIdentifier }),
      setRegion: ({ storeKey, country, currency, locale }) =>
        set({
          storeKey,
          country,
          currency,
          locale
        }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setWishlist: (wishlist) => set({ wishlist }),
      toggleWishlistItem: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((item) => item !== productId)
            : [...state.wishlist, productId]
        })),
      setCartCount: (cartCount) => set({ cartCount }),
      setGuestCart: (guestCart) =>
        set({
          guestCart,
          cartCount: guestCart.reduce((sum, item) => sum + item.quantity, 0)
        }),
      addGuestCartItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.guestCart.find((item) => item.productId._id === product._id);
          const guestCart = existingItem
            ? state.guestCart.map((item) =>
                item.productId._id === product._id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [
                ...state.guestCart,
                {
                  productId: product,
                  quantity,
                  unitPrice: product.pricing.saleAmount || product.pricing.amount,
                  currency: product.displayCurrency || product.pricing.baseCurrency
                }
              ];

          return {
            guestCart,
            cartCount: guestCart.reduce((sum, item) => sum + item.quantity, 0)
          };
        }),
      updateGuestCartItemQuantity: (productId, quantity) =>
        set((state) => {
          const guestCart = state.guestCart.map((item) =>
            item.productId._id === productId ? { ...item, quantity } : item
          );

          return {
            guestCart,
            cartCount: guestCart.reduce((sum, item) => sum + item.quantity, 0)
          };
        }),
      removeGuestCartItem: (productId) =>
        set((state) => {
          const guestCart = state.guestCart.filter((item) => item.productId._id !== productId);

          return {
            guestCart,
            cartCount: guestCart.reduce((sum, item) => sum + item.quantity, 0)
          };
        }),
      setSavedShippingAddress: (savedShippingAddress) => set({ savedShippingAddress }),
      setRecommendations: (recommendations) => set({ recommendations }),
      markHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => stateStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        rememberedIdentifier: state.rememberedIdentifier,
        storeKey: state.storeKey,
        country: state.country,
        currency: state.currency,
        locale: state.locale,
        themePreference: state.themePreference,
        wishlist: state.wishlist,
        cartCount: state.cartCount,
        guestCart: state.guestCart,
        savedShippingAddress: state.savedShippingAddress
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true);
      }
    }
  )
);
