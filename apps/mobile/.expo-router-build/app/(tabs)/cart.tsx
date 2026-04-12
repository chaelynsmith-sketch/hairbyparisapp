import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchCart, removeCartItem, updateCartItemQuantity } from "@/services/cart-service";
import { useSessionStore } from "@/store/session-store";

export default function CartScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const setCartCount = useSessionStore((state) => state.setCartCount);
  const guestCart = useSessionStore((state) => state.guestCart);
  const updateGuestCartItemQuantity = useSessionStore((state) => state.updateGuestCartItemQuantity);
  const removeGuestCartItem = useSessionStore((state) => state.removeGuestCartItem);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlistItem = useSessionStore((state) => state.toggleWishlistItem);
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: Boolean(user)
  });

  const items = user ? cart?.items || [] : guestCart;
  const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
  const shippingFee = items.length ? (subtotal >= 1500 ? 0 : 135) : 0;
  const estimatedTotal = subtotal + shippingFee;
  const totalItemCount = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const refreshCartState = (nextCart: any) => {
    queryClient.setQueryData(["cart"], nextCart);
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    setCartCount((nextCart?.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0));
  };

  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItemQuantity(productId, quantity),
    onSuccess: refreshCartState
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId: string) => removeCartItem(productId),
    onSuccess: refreshCartState
  });

  useEffect(() => {
    setCartCount(totalItemCount);
  }, [setCartCount, totalItemCount]);

  return (
    <Screen>
      <ScreenHeader
        title="Cart"
        subtitle="Review what you have ready before checkout."
        actionLabel={items.length ? (user ? "Checkout" : "Sign in") : "Shop"}
        onActionPress={() => router.push(items.length ? (user ? "/orders/checkout" : "/auth/login") : "/(tabs)/shop")}
      />
      {!items.length ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={{ color: theme.muted }}>Add products from the catalog to begin checkout.</Text>
          <Pressable onPress={() => router.push("/(tabs)/shop")} style={[styles.button, { backgroundColor: theme.primary }]}>
            <Text style={styles.buttonText}>Browse products</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.list}>
            {items.map((item: any) => {
              const itemKey = item._id || `${item.productId?._id}:${item.variantId || ""}`;
              return (
              <View key={itemKey} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.productName, { color: theme.text }]}>{item.productId?.name || "Cart item"}</Text>
                {item.variantLabel ? <Text style={{ color: theme.muted }}>Option: {item.variantLabel}</Text> : null}
                <Text style={{ color: theme.muted }}>
                  {item.currency} {item.unitPrice.toFixed(2)} each
                </Text>
                <Text style={{ color: theme.primary }}>
                  {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
                </Text>
                <View style={styles.controlsRow}>
                  <View style={styles.quantityRow}>
                    <Pressable
                      onPress={() =>
                        user
                          ? item.quantity > 1
                          ? updateQuantityMutation.mutate({
                                productId: itemKey,
                                quantity: item.quantity - 1
                              })
                            : removeItemMutation.mutate(itemKey)
                          : item.quantity > 1
                            ? updateGuestCartItemQuantity(itemKey, item.quantity - 1)
                            : removeGuestCartItem(itemKey)
                      }
                      style={[styles.quantityButton, { borderColor: theme.border, backgroundColor: theme.canvas }]}
                    >
                      <Text style={[styles.quantityButtonText, { color: theme.text }]}>-</Text>
                    </Pressable>
                    <Text style={[styles.quantityValue, { color: theme.text }]}>{item.quantity}</Text>
                    <Pressable
                      onPress={() =>
                        user
                          ? updateQuantityMutation.mutate({
                              productId: itemKey,
                              quantity: item.quantity + 1
                            })
                          : updateGuestCartItemQuantity(itemKey, item.quantity + 1)
                      }
                      style={[styles.quantityButton, { borderColor: theme.border, backgroundColor: theme.canvas }]}
                    >
                      <Text style={[styles.quantityButtonText, { color: theme.text }]}>+</Text>
                    </Pressable>
                  </View>
                  <View style={styles.actionColumn}>
                    <Pressable
                      onPress={() =>
                        user ? removeItemMutation.mutate(itemKey) : removeGuestCartItem(itemKey)
                      }
                      style={[styles.inlineAction, { borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.text, fontWeight: "700" }}>Remove</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (!wishlist.includes(item.productId._id)) {
                          toggleWishlistItem(item.productId._id);
                        }
                        if (user) {
                          removeItemMutation.mutate(itemKey);
                        } else {
                          removeGuestCartItem(itemKey);
                        }
                      }}
                      style={[styles.inlineAction, { borderColor: theme.border }]}
                    >
                      <Text style={{ color: theme.primary, fontWeight: "700" }}>Move to wishlist</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
            })}
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {items[0]?.currency || "ZAR"} {subtotal.toFixed(2)}
            </Text>
            <Text style={{ color: theme.text }}>Estimated shipping</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {items[0]?.currency || "ZAR"} {shippingFee.toFixed(2)}
            </Text>
            <Text style={{ color: theme.text }}>Estimated total</Text>
            <Text style={[styles.subtotal, { color: theme.primary }]}>
              {items[0]?.currency || "ZAR"} {estimatedTotal.toFixed(2)}
            </Text>
            <Text style={{ color: theme.muted }}>
              Final tax and any voucher discount are confirmed at checkout.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(user ? "/orders/checkout" : "/auth/login")}
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.buttonText}>{user ? "Continue to checkout" : "Sign in to checkout"}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  list: {
    gap: 12
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10
  },
  productName: {
    fontSize: 17,
    fontWeight: "700"
  },
  controlsRow: {
    gap: 12
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "700"
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center"
  },
  actionColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  inlineAction: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600"
  },
  subtotal: {
    fontSize: 20,
    fontWeight: "700"
  },
  button: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
