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
  const [texture, setTexture] = useState<string | undefined>();
  const [length, setLength] = useState<string | undefined>();
  const [priceBand, setPriceBand] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const { data: sourceProducts = [] } = useQuery({
    queryKey: ["products", search, currency],
    queryFn: () => fetchProducts({ search, currency }),
    refetchOnMount: "always"
  });
  const { data: categorySourceProducts = [] } = useQuery({
    queryKey: ["product-categories", currency],
    queryFn: () => fetchProducts({ currency }),
    refetchOnMount: "always"
  });
  const categories = Array.from(
    new Set(
      [...categorySourceProducts, ...sourceProducts]
        .map((product: StorefrontProduct) => product.category)
        .filter(Boolean)
    )
  );
  const textures = Array.from(new Set(sourceProducts.map((product: StorefrontProduct) => product.attributes?.texture).filter(Boolean)));
  const lengths = Array.from(new Set(sourceProducts.map((product: StorefrontProduct) => product.attributes?.length).filter(Boolean)));
  const priceBands = [
    { label: "Under R1,000", value: "under-1000", test: (price: number) => price < 1000 },
    { label: "R1,000 - R2,500", value: "1000-2500", test: (price: number) => price >= 1000 && price <= 2500 },
    { label: "R2,500+", value: "2500-plus", test: (price: number) => price > 2500 }
  ];
  const selectedPriceBand = priceBands.find((item) => item.value === priceBand);
  const products = sourceProducts.filter((product: StorefrontProduct) => {
    const price = product.displayPrice ?? product.pricing.saleAmount ?? product.pricing.amount;
    return (
      (!category || product.category === category) &&
      (!texture || product.attributes?.texture === texture) &&
      (!length || product.attributes?.length === length) &&
      (!selectedPriceBand || selectedPriceBand.test(price))
    );
  });
  const hasFilters = Boolean(category || texture || length || priceBand || search);

  return (
    <Screen>
      <ScreenHeader
        title="Shop the full catalog"
        subtitle="Search and filter by texture, length, price, and category for a fast luxury shopping flow."
        actionLabel={hasFilters ? "Clear filters" : "Back home"}
        onActionPress={() => {
          if (hasFilters) {
            setCategory(undefined);
            setTexture(undefined);
            setLength(undefined);
            setPriceBand(undefined);
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
          Browse wigs, bundles, closures, frontals, and accessories by texture, length, price, or category.
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
      {[
        ["Texture", textures, texture, setTexture],
        ["Length", lengths, length, setLength],
        ["Price", priceBands.map((item) => item.label), selectedPriceBand?.label, (value?: string) => setPriceBand(priceBands.find((item) => item.label === value)?.value)]
      ].map(([label, items, activeValue, setter]: any) =>
        items.length ? (
          <View key={label} style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: theme.muted }]}>{label}</Text>
            <View style={styles.filters}>
              {items.map((item: string) => {
                const active = activeValue === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setter(active ? undefined : item)}
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
          </View>
        ) : null
      )}

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
    borderRadius: 2,
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
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "400",
    letterSpacing: 0.4
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22
  },
  search: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterGroup: {
    gap: 8
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: 1
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  resultsCount: {
    fontFamily: "Georgia",
    fontSize: 20,
    fontWeight: "400"
  },
  grid: {
    gap: 16
  }
});
