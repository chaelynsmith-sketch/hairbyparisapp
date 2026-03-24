import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { StorefrontProduct } from "@/types";

type ProductCardProps = {
  product: StorefrontProduct;
  onPress?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
};

export function ProductCard({ product, onPress, onToggleWishlist, isWishlisted }: ProductCardProps) {
  const theme = useTheme();
  const image = product.media?.[0]?.url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702";
  const price = product.displayPrice ?? product.pricing.saleAmount ?? product.pricing.amount;
  const compareAt = product.pricing.saleAmount ? product.pricing.amount : null;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={[styles.badge, { backgroundColor: theme.spotlight }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{product.category}</Text>
        </View>
        {onToggleWishlist ? (
          <Pressable onPress={onToggleWishlist} style={styles.wishlistButton}>
            <Feather name="heart" size={18} color={isWishlisted ? theme.primary : theme.text} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.meta, { color: theme.muted }]}>
          {product.attributes?.texture || product.attributes?.material || "Signature beauty edit"}
        </Text>
        <View style={styles.footer}>
          <View>
            <Text style={[styles.price, { color: theme.primary }]}>
              {product.displayCurrency} {price.toFixed(2)}
            </Text>
            {compareAt ? (
              <Text style={[styles.compareAt, { color: theme.muted }]}>
                Was {product.displayCurrency} {compareAt.toFixed(2)}
              </Text>
            ) : null}
          </View>
          <View style={[styles.stockPill, { backgroundColor: theme.canvas }]}>
            <Text style={[styles.stockText, { color: theme.text }]}>{product.inventory.quantity} in stock</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#2D1B14",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4
  },
  image: {
    width: "100%",
    height: 210
  },
  badge: {
    position: "absolute",
    left: 14,
    top: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  wishlistButton: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)"
  },
  content: {
    padding: 16,
    gap: 8
  },
  name: {
    fontSize: 18,
    fontWeight: "700"
  },
  meta: {
    fontSize: 13,
    lineHeight: 20
  },
  footer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12
  },
  price: {
    fontSize: 16,
    fontWeight: "600"
  },
  compareAt: {
    fontSize: 12,
    textDecorationLine: "line-through",
    marginTop: 3
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999
  },
  stockText: {
    fontSize: 11,
    fontWeight: "600"
  }
});
