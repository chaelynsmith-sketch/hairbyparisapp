import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
    "Texture-matched bundles",
    "Lace units for quick installs",
    "Scalp care and styling tools"
  ];

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroEyebrow}>Hair By Paris</Text>
            <Text style={styles.heroTitle}>{t("common.welcome")}</Text>
            <Text style={styles.heroCopy}>
              Global beauty commerce with AI-guided matching, polished installs, and salon-grade essentials.
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>48h</Text>
            <Text style={styles.heroStatLabel}>Express dispatch on selected orders</Text>
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
          <Text style={[styles.featureValue, { color: theme.text }]}>Stripe, PayPal, PayFast</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push("/(tabs)/chat")} style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.quickActionTitle, { color: theme.text }]}>Beauty AI</Text>
          <Text style={{ color: theme.muted }}>Get guided recommendations</Text>
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
    padding: 24,
    borderRadius: 28,
    gap: 18
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18
  },
  heroTextWrap: {
    flex: 1,
    gap: 10
  },
  heroEyebrow: {
    color: "#FFF5EF",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 12
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800"
  },
  heroCopy: {
    color: "#FFF5EF",
    lineHeight: 22,
    maxWidth: 300
  },
  heroStat: {
    width: 108,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 22,
    padding: 14,
    justifyContent: "space-between"
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800"
  },
  heroStatLabel: {
    color: "#FFF5EF",
    fontSize: 12,
    lineHeight: 18
  },
  heroPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  heroPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600"
  },
  search: {
    borderWidth: 1,
    borderRadius: 18,
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
    borderRadius: 22,
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
    borderRadius: 22,
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
    fontSize: 22,
    fontWeight: "700"
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
