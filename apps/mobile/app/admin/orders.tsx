import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchAdminOrders, updateAdminOrder } from "@/services/admin-service";

function formatStatus(value?: string) {
  if (!value) {
    return "Pending";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminOrdersScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [orderStatus, setOrderStatus] = useState("processing");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders
  });

  const selectedOrder = orders.find((order: any) => order._id === selectedOrderId);
  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminOrder(selectedOrderId!, {
        trackingNumber,
        trackingUrl,
        status: orderStatus
      }),
    onSuccess: () => {
      setFeedbackMessage("Shipping update saved.");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-track", selectedOrderId] });
    },
    onError: (error: any) => {
      setFeedbackMessage("");
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to save shipping update.");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Manage orders"
        subtitle="Update retail fulfillment status, tracking details, and customer shipping progress."
        actionLabel="Back to dashboard"
        onActionPress={() => router.replace("/admin/dashboard")}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.list}>
          {orders.map((order: any) => (
            <Pressable
              key={order._id}
              onPress={() => {
                setSelectedOrderId(order._id);
                setTrackingNumber(order.fulfillment?.trackingNumber || "");
                setTrackingUrl(order.fulfillment?.trackingUrl || "");
                setOrderStatus(order.status || "processing");
                setFeedbackMessage("");
                setErrorMessage("");
              }}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text, fontWeight: "700" }}>{order.orderNumber}</Text>
              <Text style={{ color: theme.muted }}>
                {formatStatus(order.status)}
              </Text>
            </Pressable>
          ))}
        </View>

        {selectedOrder ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Edit retail fulfillment</Text>
            <TextInput
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Tracking number"
              placeholderTextColor={theme.muted}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
            />
            <TextInput
              value={trackingUrl}
              onChangeText={setTrackingUrl}
              placeholder="Tracking URL"
              placeholderTextColor={theme.muted}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
            />
            <View style={styles.optionRow}>
              {["processing", "packed", "shipped", "delivered"].map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setOrderStatus(value)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: orderStatus === value ? theme.primary : theme.card,
                      borderColor: orderStatus === value ? theme.primary : theme.border
                    }
                  ]}
                >
                  <Text style={{ color: orderStatus === value ? "#FFFFFF" : theme.text }}>{formatStatus(value)}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => updateMutation.mutate()}
              style={[styles.button, { backgroundColor: theme.primary, opacity: updateMutation.isPending ? 0.7 : 1 }]}
            >
              <Text style={styles.buttonText}>{updateMutation.isPending ? "Saving..." : "Save order update"}</Text>
            </Pressable>
            {feedbackMessage ? <Text style={{ color: theme.primary, fontWeight: "700" }}>{feedbackMessage}</Text> : null}
            {errorMessage ? <Text style={{ color: "#B3261E", fontWeight: "700" }}>{errorMessage}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 24
  },
  list: {
    gap: 10
  },
  card: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 16,
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  optionPill: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  button: {
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  linkButton: {
    alignItems: "flex-start"
  }
});
