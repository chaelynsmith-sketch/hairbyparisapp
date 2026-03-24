import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchProducts } from "@/services/catalog-service";
import { useSessionStore } from "@/store/session-store";
import { StorefrontProduct } from "@/types";

export default function ShopScreen() {
  const theme = useTheme();
  const currency = useSessionStore((state) => state.currency);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlistItem = useSessionStore((state) => state.toggleWishlistItem);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products", category, search, currency],
    queryFn: () => fetchProducts({ category, search, currency }),
    refetchOnMount: "always"
  });
  const { data: categorySourceProducts = [] } = useQuery({
    queryKey: ["product-categories", currency],
    queryFn: () => fetchProducts({ currency }),
    refetchOnMount: "always"
  });
  const categories = Array.from(
    new Set(
      [...categorySourceProducts, ...products]
        .map((product: StorefrontProduct) => product.category)
        .filter(Boolean)
    )
  );

  return (
    <Screen>
      <ScreenHeader
        title="Shop the full catalog"
        subtitle="Browse by category, clear filters quickly, and jump back home whenever you want."
        actionLabel={category || search ? "Clear filters" : "Back home"}
        onActionPress={() => {
          if (category || search) {
            setCategory(undefined);
            setSearch("");
            return;
          }

          router.replace("/(tabs)");
        }}
      />
      <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>Curated catalog</Text>
        <Text style={[styles.title, { color: theme.text }]}>Find your next install</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Browse bundles, wigs, care, and tools by texture, style need, or beauty routine.
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search by texture, length, or brand"
        placeholderTextColor={theme.muted}
        style={[styles.search, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />

      {categories.length ? (
        <View style={styles.filters}>
          <Pressable
            onPress={() => setCategory(undefined)}
            style={[
              styles.filterPill,
              {
                backgroundColor: !category ? theme.primary : theme.card,
                borderColor: !category ? theme.primary : theme.border
              }
            ]}
          >
            <Text style={{ color: !category ? "#FFFFFF" : theme.text }}>All categories</Text>
          </Pressable>
          {categories.map((item) => {
            const active = category === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(active ? undefined : item)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? theme.primary : theme.card,
                    borderColor: active ? theme.primary : theme.border
                  }
                ]}
              >
                <Text style={{ color: active ? "#FFFFFF" : theme.text }}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: theme.text }]}>
          {products.length} product{products.length === 1 ? "" : "s"}
        </Text>
        <Text style={{ color: theme.muted }}>{category || "All categories"}</Text>
      </View>

      <View style={styles.grid}>
        {products.map((product: StorefrontProduct) => (
          <ProductCard
            key={product._id}
            product={product}
            isWishlisted={wishlist.includes(product._id)}
            onToggleWishlist={() => toggleWishlistItem(product._id)}
            onPress={() => router.push(`/product/${product._id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 8
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1
  },
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22
  },
  search: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: "700"
  },
  grid: {
    gap: 16
  }
});
