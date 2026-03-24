import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchPayouts, updatePayout } from "@/services/admin-service";

function formatStatus(value?: string) {
  if (!value) {
    return "Pending";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminPayoutsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: payouts = [] } = useQuery({
    queryKey: ["payouts"],
    queryFn: fetchPayouts
  });
  const updateMutation = useMutation({
    mutationFn: ({ payoutId, status }: { payoutId: string; status: string }) => updatePayout(payoutId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Payouts"
        subtitle="Track what is owed to suppliers and the admin settlement side."
        actionLabel="Back to dashboard"
        onActionPress={() => router.replace("/admin/dashboard")}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {payouts.map((payout: any) => (
          <View key={payout._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{payout.recipientName}</Text>
            <Text style={{ color: theme.muted }}>
              {formatStatus(payout.recipientType)} | {formatStatus(payout.status)}
            </Text>
            <Text style={{ color: theme.muted }}>Method: {formatStatus(payout.method)}</Text>
            <Text style={{ color: theme.muted }}>Destination: {payout.destinationLabel || "Pending"}</Text>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>
              {payout.currency} {Number(payout.amount || 0).toFixed(2)}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => updateMutation.mutate({ payoutId: payout._id, status: "paid" })}
                style={[styles.actionButton, { backgroundColor: theme.primary, opacity: updateMutation.isPending ? 0.7 : 1 }]}
              >
                <Text style={styles.actionButtonText}>Mark paid</Text>
              </Pressable>
              <Pressable
                onPress={() => updateMutation.mutate({ payoutId: payout._id, status: "cancelled" })}
                style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
              >
                <Text style={{ color: theme.text, fontWeight: "700" }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 24
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center"
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center"
  }
});
