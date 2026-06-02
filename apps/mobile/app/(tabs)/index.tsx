import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ProductCard } from "@/components/product-card";
import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";
import { fetchProducts } from "@/services/catalog-service";
import { useSessionStore } from "@/store/session-store";
import { StorefrontProduct } from "@/types";

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const currency = useSessionStore((state) => state.currency);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlistItem = useSessionStore((state) => state.toggleWishlistItem);
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["products", "featured", currency],
    queryFn: () => fetchProducts({ featured: "true", currency })
  });
  const recommendationCopy = [
    "Luxury wigs",
    "Premium bundles",
    "Closures, frontals & accessories"
  ];

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroGrid}>
          <View style={[styles.heroLogoPanel, { backgroundColor: theme.canvas }]}>
            <Image source={require("@/assets/hair-by-paris-logo.png")} style={styles.heroImage} resizeMode="contain" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroEyebrow, { color: theme.accent }]}>Hair By Paris</Text>
            <Text style={styles.heroTitle}>Luxury hair, refined.</Text>
            <Text style={styles.heroCopy}>
              Premium South African retail hair, curated for polished installs and everyday luxury.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/shop")} style={[styles.heroButton, { borderColor: theme.accent }]}>
              <Text style={styles.heroButtonText}>Shop retail</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroPills}>
          {recommendationCopy.map((item) => (
            <View key={item} style={styles.heroPill}>
              <Text style={styles.heroPillText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <TextInput
        placeholder={t("common.search")}
        placeholderTextColor={theme.muted}
        style={[styles.search, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />

      <View style={styles.featureStrip}>
        <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.featureLabel, { color: theme.muted }]}>Best for</Text>
          <Text style={[styles.featureValue, { color: theme.text }]}>Installs & daily glam</Text>
        </View>
        <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.featureLabel, { color: theme.muted }]}>Payments</Text>
          <Text style={[styles.featureValue, { color: theme.text }]}>PayFast card & EFT</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push("/(tabs)/shop")} style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.quickActionTitle, { color: theme.text }]}>Shop retail</Text>
          <Text style={{ color: theme.muted }}>Wigs, bundles, closures and accessories</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/wishlist")} style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.quickActionTitle, { color: theme.text }]}>Wishlist</Text>
          <Text style={{ color: theme.muted }}>{wishlist.length} saved items</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured collection</Text>
          <Text style={[styles.sectionCopy, { color: theme.muted }]}>Best-selling pieces curated for seamless installs.</Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/shop")}>
          <Text style={[styles.sectionAction, { color: theme.primary }]}>View all</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {featuredProducts.map((product: StorefrontProduct) => (
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
    padding: 0,
    borderRadius: 2,
    overflow: "hidden",
    gap: 0
  },
  heroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    minHeight: 188
  },
  heroLogoPanel: {
    width: 178,
    minHeight: 188,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  heroImage: {
    width: "100%",
    height: 150
  },
  heroTextWrap: {
    flex: 1,
    gap: 9,
    justifyContent: "center",
    padding: 20,
    minWidth: 240
  },
  heroEyebrow: {
    letterSpacing: 4,
    textTransform: "uppercase",
    fontSize: 10
  },
  heroTitle: {
    color: "#F5EDD8",
    fontFamily: "Georgia",
    fontSize: 30,
    fontWeight: "400",
    lineHeight: 35
  },
  heroCopy: {
    color: "#EDE0C4",
    lineHeight: 19,
    maxWidth: 320,
    fontSize: 12
  },
  heroButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4
  },
  heroButtonText: {
    color: "#F5EDD8",
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: "uppercase"
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(200,139,58,0.35)"
  },
  heroPill: {
    borderRightWidth: 1,
    borderRightColor: "rgba(200,139,58,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroPillText: {
    color: "#EDE0C4",
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase"
  },
  search: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  featureStrip: {
    flexDirection: "row",
    gap: 12
  },
  featureCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    padding: 16,
    gap: 6
  },
  featureLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  featureValue: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },
  quickActions: {
    flexDirection: "row",
    gap: 12
  },
  quickAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 2,
    padding: 16,
    gap: 6
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  sectionHeader: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12
  },
  sectionTitle: {
    fontFamily: "Georgia",
    fontSize: 25,
    fontWeight: "400"
  },
  sectionCopy: {
    marginTop: 4,
    fontSize: 13
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "700"
  },
  grid: {
    gap: 16
  }
});
