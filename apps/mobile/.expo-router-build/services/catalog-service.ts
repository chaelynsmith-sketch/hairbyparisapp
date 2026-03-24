import { api } from "@/services/api";
import { Review } from "@/types";

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  currency?: string;
  featured?: string;
}) {
  const { data } = await api.get("/products", { params });
  return data.products;
}

export async function fetchProduct(productId: string) {
  const { data } = await api.get(`/products/${productId}`);
  return data;
}

export async function createProduct(payload: Record<string, unknown>) {
  const { data } = await api.post("/products", payload);
  return data.product;
}

export async function updateProduct(productId: string, payload: Record<string, unknown>) {
  const { data } = await api.put(`/products/${productId}`, payload);
  return data.product;
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data } = await api.get("/reviews", { params: { productId } });
  return data.reviews;
}

export async function createReview(payload: Record<string, unknown>) {
  const { data } = await api.post("/reviews", payload);
  return data.review;
}
