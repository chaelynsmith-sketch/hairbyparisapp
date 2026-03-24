import { api } from "@/services/api";

export async function fetchCart() {
  const { data } = await api.get("/cart");
  return data.cart;
}

export async function addToCart(productId: string, quantity = 1) {
  const { data } = await api.post("/cart/items", { productId, quantity });
  return data.cart;
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
  return data.cart;
}

export async function removeCartItem(productId: string) {
  const { data } = await api.delete(`/cart/items/${productId}`);
  return data.cart;
}
