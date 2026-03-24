import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { sendCampaignNotification } from "@/services/admin-service";

export default function AdminNotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [campaignType, setCampaignType] = useState<"promotion" | "new_product">("promotion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      setStatusMessage("");
      setErrorMessage("");

      if (!title.trim()) {
        throw new Error("Notification title is required.");
      }

      if (!body.trim()) {
        throw new Error("Notification message is required.");
      }

      return sendCampaignNotification({
        audience: "all_customers",
        title,
        body,
        data: { type: campaignType }
      });
    },
    onSuccess: (result) => {
      setStatusMessage(`Notification sent to ${result.count || 0} customers.`);
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to send notification.");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Campaign notifications"
        subtitle="Send promotions and new product alerts to your customer base."
        actionLabel="Back to dashboard"
        onActionPress={() => router.replace("/admin/dashboard")}
      />
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Campaign type</Text>
        <View style={styles.row}>
          {[
            ["promotion", "Promotion"],
            ["new_product", "New product"]
          ].map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setCampaignType(value as "promotion" | "new_product")}
              style={[
                styles.pill,
                {
                  backgroundColor: campaignType === value ? theme.primary : theme.canvas
                }
              ]}
            >
              <Text style={{ color: campaignType === value ? "#FFFFFF" : theme.text }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Write the message customers should receive"
          placeholderTextColor={theme.muted}
          multiline
          style={[styles.input, styles.messageInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        {statusMessage ? <Text style={[styles.feedback, { color: theme.primary }]}>{statusMessage}</Text> : null}
        {errorMessage ? <Text style={[styles.feedback, styles.error]}>{errorMessage}</Text> : null}
        <Pressable
          onPress={() => sendMutation.mutate()}
          style={[styles.button, { backgroundColor: theme.primary, opacity: sendMutation.isPending ? 0.7 : 1 }]}
        >
          <Text style={styles.buttonText}>{sendMutation.isPending ? "Sending..." : "Send to customers"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  feedback: {
    fontSize: 14,
    fontWeight: "600"
  },
  error: {
    color: "#B3261E"
  },
  button: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
