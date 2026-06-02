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
  const rememberedIdentifier = useSessionStore((state) => state.rememberedIdentifier);
  const setRememberedIdentifier = useSessionStore((state) => state.setRememberedIdentifier);
  const [identifier, setIdentifier] = useState(rememberedIdentifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () => login(identifier, password),
    onSuccess: (data) => {
      setRememberedIdentifier(identifier.trim());
      setSession(data);
      router.replace("/(tabs)");
    }
  });
  return (
    <Screen>
      <ScreenHeader
        title="Sign in"
        subtitle="Sign in with your verified account email, phone, or username and password."
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
        secureTextEntry={!showPassword}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.passwordToggle}>
        <Text style={[styles.linkText, { color: theme.primary }]}>{showPassword ? "Hide password" : "Show password"}</Text>
      </Pressable>
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
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  button: {
    paddingVertical: 18,
    borderRadius: 2,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  links: {
    gap: 10
  },
  passwordToggle: {
    alignSelf: "flex-start",
    marginTop: -6
  },
  linkText: {
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E"
  }
});
