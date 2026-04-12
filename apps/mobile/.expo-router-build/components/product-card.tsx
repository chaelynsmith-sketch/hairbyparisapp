import { Feather } from "@expo/vector-icons";
import { useState } from "react";
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
  const coverImage =
    product.media?.find((item) => item.type === "image" && item.url)?.url ||
    product.variants?.flatMap((variant) => variant.media || []).find((item) => item.type === "image" && item.url)?.url;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(coverImage && !imageFailed);
  const variantPrices = product.variants?.map((variant) => variant.salePrice || variant.price).filter((price): price is number => Boolean(price)) || [];
  const price = variantPrices.length
    ? Math.min(...variantPrices)
    : product.displayPrice ?? product.pricing.saleAmount ?? product.pricing.amount;
  const compareAt = !variantPrices.length && product.pricing.saleAmount ? product.pricing.amount : null;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View>
        {showImage ? (
          <Image source={{ uri: coverImage }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.canvas }]}>
            <Feather name="image" size={28} color={theme.muted} />
            <Text style={[styles.placeholderText, { color: theme.muted }]}>No product image yet</Text>
          </View>
        )}
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
              {variantPrices.length ? "From " : ""}{product.displayCurrency} {price.toFixed(2)}
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
  imagePlaceholder: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "700"
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
