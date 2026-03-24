import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchProducts } from "@/services/catalog-service";
import { addToCart } from "@/services/cart-service";
import { useSessionStore } from "@/store/session-store";
import { StorefrontProduct } from "@/types";

export default function WishlistScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const currency = useSessionStore((state) => state.currency);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlistItem = useSessionStore((state) => state.toggleWishlistItem);
  const setCartCount = useSessionStore((state) => state.setCartCount);
  const addGuestCartItem = useSessionStore((state) => state.addGuestCartItem);
  const guestCart = useSessionStore((state) => state.guestCart);
  const { data: products = [] } = useQuery({
    queryKey: ["products", "wishlist", currency],
    queryFn: () => fetchProducts({ currency })
  });

  const wishlistProducts = products.filter((product: StorefrontProduct) => wishlist.includes(product._id));
  const addToCartMutation = useMutation({
    mutationFn: (product: StorefrontProduct) => {
      if (!user) {
        addGuestCartItem(product, 1);
        return Promise.resolve(null);
      }

      return addToCart(product._id, 1);
    },
    onSuccess: (cart) => {
      if (!user) {
        const nextCount = guestCart.reduce((sum, item) => sum + item.quantity, 0) + 1;
        setCartCount(nextCount);
        return;
      }

      queryClient.setQueryData(["cart"], cart);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setCartCount((cart?.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0));
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Wishlist"
        subtitle="Save products you want to compare or buy later."
        actionLabel="Shop"
        onActionPress={() => router.push("/(tabs)/shop")}
      />
      {!wishlistProducts.length ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved items yet</Text>
          <Text style={{ color: theme.muted }}>Tap the heart on any product to save it here.</Text>
          <Pressable onPress={() => router.push("/(tabs)/shop")} style={[styles.button, { backgroundColor: theme.primary }]}>
            <Text style={styles.buttonText}>Browse products</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.grid}>
          {wishlistProducts.map((product: StorefrontProduct) => (
            <View key={product._id} style={styles.itemBlock}>
              <ProductCard
                product={product}
                isWishlisted
                onToggleWishlist={() => toggleWishlistItem(product._id)}
                onPress={() => router.push(`/product/${product._id}`)}
              />
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => toggleWishlistItem(product._id)}
                  style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.card }]}
                >
                  <Text style={{ color: theme.text, fontWeight: "700" }}>Remove from wishlist</Text>
                </Pressable>
                <Pressable
                  onPress={() => addToCartMutation.mutate(product)}
                  style={[styles.primaryAction, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.buttonText}>
                    {addToCartMutation.isPending ? "Adding..." : "Quick add to cart"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
  button: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  grid: {
    gap: 16
  },
  itemBlock: {
    gap: 10
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryAction: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center"
  }
});
