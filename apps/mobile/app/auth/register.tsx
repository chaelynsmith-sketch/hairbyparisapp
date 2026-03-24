import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { register } from "@/services/auth-service";
import { useSessionStore } from "@/store/session-store";

export default function RegisterScreen() {
  const theme = useTheme();
  const setSession = useSessionStore((state) => state.setSession);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });

  const mutation = useMutation({
    mutationFn: () =>
      register({
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
        storeSlug: "hair-by-paris-global",
        country: "ZA",
        currency: "ZAR",
        preferredLanguage: "en"
      }),
    onSuccess: (data) => {
      setSession(data);
      router.replace("/(tabs)");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Create account"
        subtitle="Register with an email address or phone number, choose a username, and set a password with at least 14 characters, letters, numbers, and a special character."
        actionLabel="Back to sign in"
        onActionPress={() => router.replace("/auth/login")}
      />
      {([
        ["firstName", "First name"],
        ["lastName", "Last name"],
        ["username", "Username"],
        ["email", "Email address"],
        ["phone", "Phone number"],
        ["password", "Password"]
      ] as const).map(([field, label]) => (
        <TextInput
          key={field}
          value={form[field]}
          onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))}
          placeholder={label}
          placeholderTextColor={theme.muted}
          autoCapitalize={field === "firstName" || field === "lastName" ? "words" : "none"}
          keyboardType={field === "phone" ? "phone-pad" : "default"}
          secureTextEntry={field === "password"}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        />
      ))}
      <Text style={{ color: theme.muted }}>Use at least one contact field: email or phone.</Text>
      <Text style={{ color: theme.muted }}>Password rule: 14+ characters with letters, numbers, and a special character.</Text>
      {mutation.error ? <Text style={styles.errorText}>{(mutation.error as any)?.response?.data?.message || "Unable to create account"}</Text> : null}
      <Pressable onPress={() => mutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
        <Text style={styles.buttonText}>Create account</Text>
      </Pressable>
      <View style={styles.links}>
        <Pressable onPress={() => router.replace("/auth/login")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Already have an account</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  button: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  links: {
    gap: 10
  },
  linkText: {
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E"
  }
});
