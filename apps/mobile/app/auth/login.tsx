import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { login } from "@/services/auth-service";
import { useSessionStore } from "@/store/session-store";

export default function LoginScreen() {
  const theme = useTheme();
  const setSession = useSessionStore((state) => state.setSession);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(identifier, password),
    onSuccess: (data) => {
      setSession(data);
      router.replace("/(tabs)");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Sign in"
        subtitle="Use your email, phone number, or username with a password that is at least 14 characters and includes letters, numbers, and a special character."
        actionLabel="Back to profile"
        onActionPress={() => router.replace("/(tabs)/profile")}
      />
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Email, phone, or username"
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={theme.muted}
        secureTextEntry
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      {mutation.error ? <Text style={styles.errorText}>{(mutation.error as any)?.response?.data?.message || "Unable to sign in"}</Text> : null}
      <Pressable onPress={() => mutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
      <View style={styles.links}>
        <Pressable onPress={() => router.push("/auth/register")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Create account</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/auth/forgot-password")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Forgot password</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/auth/recover-username")}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Forgot username</Text>
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
