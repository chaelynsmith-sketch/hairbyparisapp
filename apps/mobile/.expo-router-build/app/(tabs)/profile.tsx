import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { themeLabels, ThemeOption } from "@/constants/theme";
import { Screen } from "@/components/screen";
import { regions } from "@/constants/regions";
import { useTheme } from "@/hooks/use-theme";
import { registerDeviceForPushNotifications } from "@/services/notification-service";
import { useSessionStore } from "@/store/session-store";

type PushRegistrationResult = {
  success: boolean;
  message: string;
  token?: string;
};

export default function ProfileScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user, country, currency, setRegion, clearSession, setGuestCart, themePreference, setThemePreference } =
    useSessionStore();
  const enablePushMutation = useMutation<PushRegistrationResult>({
    mutationFn: registerDeviceForPushNotifications
  });

  function handleLogout() {
    const cart = queryClient.getQueryData(["cart"]) as any;

    if (cart?.items?.length) {
      setGuestCart(
        cart.items
          .filter((item: any) => item.productId?._id)
          .map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency
          }))
      );
    }

    clearSession();
    queryClient.clear();
    router.replace("/auth/login");
  }

  return (
    <Screen>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.name, { color: theme.text }]}>
          {user ? `${user.firstName} ${user.lastName}` : "Guest shopper"}
        </Text>
        <Text style={{ color: theme.muted }}>{user?.email || "Sign in to sync your profile, orders, and wishlist."}</Text>
        <Text style={{ color: theme.primary }}>Loyalty points: {user?.loyaltyPoints || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Region and currency</Text>
        {regions.map((region) => (
          <Pressable
            key={region.code}
            onPress={() =>
              setRegion({
                storeKey: "hair-by-paris-global",
                country: region.code,
                currency: region.currency,
                locale: region.locale
              })
            }
            style={[
              styles.regionCard,
              {
                backgroundColor: country === region.code ? theme.primary : theme.card,
                borderColor: country === region.code ? theme.primary : theme.border
              }
            ]}
          >
            <Text style={{ color: country === region.code ? "#FFFFFF" : theme.text }}>
              {region.name} | {region.currency}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        {(Object.keys(themeLabels) as ThemeOption[]).map((option) => (
          <Pressable
            key={option}
            onPress={() => setThemePreference(option)}
            style={[
              styles.regionCard,
              {
                backgroundColor: themePreference === option ? theme.primary : theme.card,
                borderColor: themePreference === option ? theme.primary : theme.border
              }
            ]}
          >
            <Text style={{ color: themePreference === option ? "#FFFFFF" : theme.text }}>{themeLabels[option]}</Text>
          </Pressable>
        ))}
      </View>

      {user?.role === "admin" || user?.role === "super_admin" ? (
        <Pressable onPress={() => router.push("/admin/dashboard")} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Admin dashboard</Text>
          <Text style={{ color: theme.muted }}>Manage products, imagery, and descriptions</Text>
        </Pressable>
      ) : null}

      {user ? (
        <Pressable onPress={() => router.push("/notifications")} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Notifications</Text>
          <Text style={{ color: theme.muted }}>View order updates and alerts</Text>
        </Pressable>
      ) : null}

      {user ? (
        <Pressable onPress={() => enablePushMutation.mutate()} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Enable push alerts</Text>
          <Text style={{ color: theme.muted }}>
            {enablePushMutation.isSuccess
              ? enablePushMutation.data?.message
              : enablePushMutation.isError
                ? "Unable to enable push notifications right now."
                : "Register this device for live order and promo push alerts"}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Policies</Text>
        <Pressable onPress={() => router.push("/legal/privacy")} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Privacy policy</Text>
          <Text style={{ color: theme.muted }}>How your data is collected, used, and protected</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/terms")} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Terms and conditions</Text>
          <Text style={{ color: theme.muted }}>Rules for accounts, orders, and using the app</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/legal/refunds")} style={[styles.adminLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: "700" }}>Refund policy</Text>
          <Text style={{ color: theme.muted }}>How delivery issues, returns, and refunds are handled</Text>
        </Pressable>
      </View>

      {user ? (
        <Pressable onPress={handleLogout} style={[styles.logout, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>Log out</Text>
        </Pressable>
      ) : (
        <View style={styles.authActions}>
          <Pressable onPress={() => router.push("/auth/login")} style={[styles.primaryAction, { backgroundColor: theme.primary }]}>
            <Text style={styles.primaryActionText}>Sign in</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/register")} style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>Create account</Text>
          </Pressable>
        </View>
      )}

      <Text style={{ color: theme.muted }}>Active currency: {currency}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 8
  },
  name: {
    fontSize: 24,
    fontWeight: "800"
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  regionCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  adminLink: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4
  },
  authActions: {
    gap: 12
  },
  primaryAction: {
    borderRadius: 18,
    padding: 16,
    alignItems: "center"
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  secondaryAction: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center"
  },
  logout: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center"
  }
});
