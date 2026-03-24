import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { simulatePaymentUpdate, trackOrder } from "@/services/order-service";
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

function formatDateTime(value?: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

function getDeliverySummary(order: any) {
  if (!order?.fulfillment?.estimatedDeliveryEnd) {
    return "Delivery estimate is being prepared.";
  }

  if (order?.status === "delivered") {
    return "Your order has been delivered.";
  }

  if (order?.fulfillment?.guaranteeStatus === "eligible_for_compensation") {
    return "This delivery is late and may qualify for compensation.";
  }

  return `Estimated delivery window: ${formatDate(order.fulfillment?.estimatedDeliveryStart)} to ${formatDate(order.fulfillment?.estimatedDeliveryEnd)}.`;
}

export default function OrderTrackingScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useSessionStore((state) => state.user);
  const { data: order } = useQuery({
    queryKey: ["order-track", id],
    queryFn: () => trackOrder(id)
  });
  const simulateMutation = useMutation({
    mutationFn: (status: "paid" | "failed" | "refunded") =>
      simulatePaymentUpdate({
        orderId: id,
        provider: order?.payment?.provider || "stripe",
        status
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-track", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  async function handleOpenTrackingLink() {
    const trackingUrl = order?.fulfillment?.trackingUrl;

    if (!trackingUrl) {
      return;
    }

    const supported = await Linking.canOpenURL(trackingUrl);
    if (supported) {
      await Linking.openURL(trackingUrl);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Order tracking"
        subtitle="Follow progress, delivery estimate, and guarantee status."
        actionLabel="Back to orders"
        onActionPress={() => router.replace("/(tabs)/orders")}
      />
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.orderNumber, { color: theme.text }]}>{order?.orderNumber || "Loading order..."}</Text>
        <Text style={{ color: theme.muted }}>Status: {formatStatus(order?.status)}</Text>
        <Text style={{ color: theme.muted }}>
          Guarantee: {formatStatus(order?.fulfillment?.guaranteeStatus)}
        </Text>
        <Text style={{ color: theme.muted }}>
          Supplier dispatch: {formatStatus(order?.fulfillment?.supplierDispatchStatus)}
        </Text>
        <Text style={{ color: theme.muted }}>
          Payment: {formatStatus(order?.payment?.provider)} | {formatStatus(order?.payment?.status)}
        </Text>
        <Text style={{ color: theme.muted }}>
          Method: {formatStatus(order?.payment?.methodType)}
        </Text>
        <Text style={{ color: theme.primary }}>
          {order?.totals?.currency} {order?.totals?.grandTotal?.toFixed?.(2) || "0.00"}
        </Text>
        <Text style={{ color: theme.text }}>{getDeliverySummary(order)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery estimate</Text>
        <Text style={{ color: theme.muted }}>
          Start: {formatDate(order?.fulfillment?.estimatedDeliveryStart)}
        </Text>
        <Text style={{ color: theme.muted }}>
          End: {formatDate(order?.fulfillment?.estimatedDeliveryEnd)}
        </Text>
        <Text style={{ color: theme.muted }}>
          Tracking number: {order?.fulfillment?.trackingNumber || "Pending"}
        </Text>
        <Text style={{ color: theme.muted }}>
          Tracking link: {order?.fulfillment?.trackingUrl || "Pending"}
        </Text>
        {order?.fulfillment?.trackingUrl ? (
          <Pressable onPress={handleOpenTrackingLink} style={[styles.trackButton, { backgroundColor: theme.primary }]}>
            <Text style={styles.trackButtonText}>Open tracking link</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Shipping address</Text>
        <Text style={{ color: theme.muted }}>{order?.shippingAddress?.recipientName || "Pending"}</Text>
        {order?.shippingAddress?.line1 ? <Text style={{ color: theme.muted }}>{order.shippingAddress.line1}</Text> : null}
        {order?.shippingAddress?.line2 ? <Text style={{ color: theme.muted }}>{order.shippingAddress.line2}</Text> : null}
        <Text style={{ color: theme.muted }}>
          {[order?.shippingAddress?.city, order?.shippingAddress?.state, order?.shippingAddress?.postalCode]
            .filter(Boolean)
            .join(", ") || "Pending"}
        </Text>
        <Text style={{ color: theme.muted }}>{order?.shippingAddress?.country || "Pending"}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Order items</Text>
        {(order?.items || []).map((item: any) => (
          <View key={`${item.productId}-${item.sku}`} style={styles.itemRow}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>{item.name}</Text>
            <Text style={{ color: theme.muted }}>Qty: {item.quantity}</Text>
            <Text style={{ color: theme.muted }}>
              {item.currency} {(item.unitPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tracking events</Text>
        {(order?.trackingEvents || []).map((event: any, index: number) => (
          <View key={`${event.status}-${index}`} style={[styles.eventRow, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>{formatStatus(event.status)}</Text>
            <Text style={{ color: theme.muted }}>{event.message}</Text>
            <Text style={{ color: theme.muted }}>
              {formatDateTime(event.timestamp)}
            </Text>
          </View>
        ))}
      </View>

      {isAdmin ? (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment test controls</Text>
          <Text style={{ color: theme.muted }}>
            Development only. Simulate a provider webhook to verify paid, failed, and refunded order handling.
          </Text>
          <View style={styles.actions}>
            {[
              ["paid", "Mark paid"],
              ["failed", "Mark failed"],
              ["refunded", "Mark refunded"]
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => simulateMutation.mutate(value as "paid" | "failed" | "refunded")}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.spotlight,
                    borderColor: theme.border,
                    opacity: simulateMutation.isPending ? 0.7 : 1
                  }
                ]}
              >
                <Text style={{ color: theme.text, fontWeight: "700" }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8
  },
  orderNumber: {
    fontSize: 22,
    fontWeight: "800"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  eventRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4
  },
  itemRow: {
    gap: 4,
    paddingVertical: 6
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  trackButton: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center"
  },
  trackButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
