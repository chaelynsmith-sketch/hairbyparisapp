import { api } from "@/services/api";

export async function fetchCart() {
  const { data } = await api.get("/cart");
  return data.cart;
}

export async function addToCart(productId: string, quantity = 1, variantId?: string) {
  const { data } = await api.post("/cart/items", { productId, quantity, variantId });
  return data.cart;
}

export async function updateCartItemQuantity(itemKey: string, quantity: number, variantId?: string) {
  const { data } = await api.patch(`/cart/items/${itemKey}`, { quantity, variantId });
  return data.cart;
}

export async function removeCartItem(itemKey: string, variantId?: string) {
  const { data } = await api.delete(`/cart/items/${itemKey}`, { params: { variantId } });
  return data.cart;
}
