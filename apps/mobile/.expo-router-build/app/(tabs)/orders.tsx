import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchOrders } from "@/services/order-service";
import { useSessionStore } from "@/store/session-store";

function formatStatus(value?: string) {
  if (!value) {
    return "Pending";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string) {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleDateString();
}

export default function OrdersScreen() {
  const theme = useTheme();
  const cartCount = useSessionStore((state) => state.cartCount);
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders
  });

  return (
    <Screen>
      <ScreenHeader
        title="Orders and delivery guarantee"
        subtitle="Track placed orders, or head to checkout when your cart is ready."
        actionLabel={cartCount > 0 ? "Go to checkout" : "Shop now"}
        onActionPress={() => router.push(cartCount > 0 ? "/orders/checkout" : "/(tabs)/shop")}
      />

      {!orders.length ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No orders yet</Text>
          <Text style={{ color: theme.muted }}>
            {cartCount > 0
              ? `You have ${cartCount} item${cartCount === 1 ? "" : "s"} ready for checkout.`
              : "Add products to your cart to start the checkout flow."}
          </Text>
          <Pressable
            onPress={() => router.push(cartCount > 0 ? "/orders/checkout" : "/(tabs)/shop")}
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.ctaText}>{cartCount > 0 ? "Review checkout" : "Browse products"}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.list}>
        {orders.map((order: any) => (
          <Pressable
            key={order._id}
            onPress={() =>
              router.push({
                pathname: "/orders/[id]",
                params: { id: order._id }
              })
            }
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Text style={[styles.orderNumber, { color: theme.text }]}>{order.orderNumber}</Text>
            <Text style={{ color: theme.muted }}>
              {formatStatus(order.status)} | {formatStatus(order.fulfillment?.guaranteeStatus || "on_track")}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 6 }}>
              Delivery by {formatDate(order.fulfillment?.estimatedDeliveryEnd)}
            </Text>
            <Text style={{ color: theme.muted }}>
              Payment: {formatStatus(order.payment?.status)}
            </Text>
            <Text style={{ color: theme.primary, marginTop: 6 }}>
              {order.totals?.currency} {order.totals?.grandTotal?.toFixed?.(2)}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 8 }}>View tracking</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14
  },
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
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "700"
  }
});
