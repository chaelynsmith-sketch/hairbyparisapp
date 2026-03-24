import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchAdminDashboard } from "@/services/admin-service";

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard
  });

  return (
    <Screen>
      <ScreenHeader
        title="Admin dashboard"
        subtitle="Monitor sales, best sellers, and catalog activity."
        actionLabel="Back to profile"
        onActionPress={() => router.replace("/(tabs)/profile")}
      />
      <View style={styles.metrics}>
        {[
          ["Revenue", data?.metrics?.revenue ?? 0],
          ["Orders", data?.metrics?.totalOrders ?? 0],
          ["Users", data?.metrics?.users ?? 0],
          ["Products", data?.metrics?.products ?? 0],
          ["Suppliers", data?.metrics?.suppliers ?? 0]
        ].map(([label, value]) => (
          <View key={label} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.muted }}>{label}</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{String(value)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular products</Text>
        {(data?.popularProducts || []).map((item: any) => (
          <View key={item._id} style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text }}>{item._id}</Text>
            <Text style={{ color: theme.primary }}>{item.salesCount}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={() => router.push("/admin/products")} style={[styles.manageButton, { backgroundColor: theme.primary }]}>
        <Text style={styles.manageButtonText}>Manage products</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/admin/orders")} style={[styles.manageButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.manageButtonText, { color: theme.text }]}>Manage orders</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/admin/suppliers")} style={[styles.manageButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.manageButtonText, { color: theme.text }]}>Manage suppliers</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/admin/payouts")} style={[styles.manageButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.manageButtonText, { color: theme.text }]}>Manage payouts</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/admin/notifications")} style={[styles.manageButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.manageButtonText, { color: theme.text }]}>Send notifications</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/admin/policies")} style={[styles.manageButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.manageButtonText, { color: theme.text }]}>Manage policies</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: 12
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800"
  },
  section: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700"
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  manageButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  manageButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
