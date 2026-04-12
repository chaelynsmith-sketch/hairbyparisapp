import { router } from "expo-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { createSupplier, fetchSuppliers } from "@/services/admin-service";

const emptyForm = {
  name: "",
  mode: "manual",
  email: "",
  apiEndpoint: "",
  payoutMethod: "manual_transfer",
  destinationLabel: ""
};

export default function AdminSuppliersScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers
  });

  const createMutation = useMutation({
    mutationFn: () => {
      setStatusMessage("");
      setErrorMessage("");

      if (!form.name.trim()) {
        throw new Error("Supplier name is required.");
      }

      if (form.mode === "email" && !form.email.trim()) {
        throw new Error("Supplier email is required for email mode.");
      }

      if (form.mode === "api" && !form.apiEndpoint.trim()) {
        throw new Error("API endpoint is required for API mode.");
      }

      return createSupplier({
        name: form.name,
        mode: form.mode,
        email: form.email || undefined,
        apiEndpoint: form.apiEndpoint || undefined,
        payoutConfig: {
          method: form.payoutMethod || "manual_transfer",
          destinationLabel: form.destinationLabel || undefined
        }
      });
    },
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setForm(emptyForm);
      setStatusMessage(`${supplier.name} created.`);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to create supplier.");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Suppliers"
        subtitle="Manage API, email, or manual supplier routing for orders."
        actionLabel="Back to dashboard"
        onActionPress={() => router.replace("/admin/dashboard")}
      />

      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Add supplier</Text>
        {statusMessage ? <Text style={{ color: theme.primary, fontWeight: "700" }}>{statusMessage}</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <TextInput
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Supplier name"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <View style={styles.modeRow}>
          {["manual", "email", "api"].map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setForm((current) => ({ ...current, mode }))}
              style={[styles.modePill, { backgroundColor: form.mode === mode ? theme.primary : theme.canvas }]}
            >
              <Text style={{ color: form.mode === mode ? "#FFFFFF" : theme.text }}>{mode}</Text>
            </Pressable>
          ))}
        </View>
        {form.mode === "email" ? (
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
            placeholder="supplier@example.com"
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
        ) : null}
        {form.mode === "api" ? (
          <TextInput
            value={form.apiEndpoint}
            onChangeText={(value) => setForm((current) => ({ ...current, apiEndpoint: value }))}
            placeholder="https://supplier.example.com/orders"
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
        ) : null}
        <View style={styles.modeRow}>
          {["manual_transfer", "bank_transfer", "cash"].map((method) => (
            <Pressable
              key={method}
              onPress={() => setForm((current) => ({ ...current, payoutMethod: method }))}
              style={[styles.modePill, { backgroundColor: form.payoutMethod === method ? theme.primary : theme.canvas }]}
            >
              <Text style={{ color: form.payoutMethod === method ? "#FFFFFF" : theme.text }}>{method}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={form.destinationLabel}
          onChangeText={(value) => setForm((current) => ({ ...current, destinationLabel: value }))}
          placeholder="Destination label or payout reference"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <Pressable onPress={() => createMutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
          <Text style={styles.buttonText}>{createMutation.isPending ? "Saving..." : "Create supplier"}</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {suppliers.map((supplier: any) => (
          <View key={supplier._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{supplier.name}</Text>
            <Text style={{ color: theme.muted }}>Mode: {supplier.mode}</Text>
            <Text style={{ color: theme.muted }}>
              Payout method: {supplier.payoutConfig?.method || "manual_transfer"}
            </Text>
            {supplier.payoutConfig?.destinationLabel ? (
              <Text style={{ color: theme.muted }}>Destination: {supplier.payoutConfig.destinationLabel}</Text>
            ) : null}
            {supplier.email ? <Text style={{ color: theme.muted }}>Email: {supplier.email}</Text> : null}
            {supplier.apiEndpoint ? <Text style={{ color: theme.muted }}>API: {supplier.apiEndpoint}</Text> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  modeRow: {
    flexDirection: "row",
    gap: 8
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  list: {
    gap: 12
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 6
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E",
    fontWeight: "700"
  }
});
