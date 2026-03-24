import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { requestPasswordOtp, resetPassword } from "@/services/auth-service";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => requestPasswordOtp(identifier),
    onSuccess: (data) => {
      setStatus(data.message);
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPassword({ identifier, otp, newPassword }),
    onSuccess: (data) => {
      setStatus(data.message);
      router.replace("/auth/login");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Reset password"
        subtitle="Request an OTP to your email or phone, then set a new password with at least 14 characters, letters, numbers, and a special character."
        actionLabel="Back to sign in"
        onActionPress={() => router.replace("/auth/login")}
      />
      <TextInput
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Email, phone, or username"
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <Pressable onPress={() => requestMutation.mutate()} style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>Send OTP</Text>
      </Pressable>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="6-digit OTP"
        placeholderTextColor={theme.muted}
        keyboardType="number-pad"
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        placeholderTextColor={theme.muted}
        secureTextEntry
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <Text style={{ color: theme.muted }}>Password rule: 14+ characters with letters, numbers, and a special character.</Text>
      {status ? <Text style={{ color: theme.muted }}>{status}</Text> : null}
      {requestMutation.error || resetMutation.error ? (
        <Text style={styles.errorText}>
          {((resetMutation.error || requestMutation.error) as any)?.response?.data?.message || "Unable to complete recovery"}
        </Text>
      ) : null}
      <Pressable onPress={() => resetMutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
        <Text style={styles.buttonText}>Reset password</Text>
      </Pressable>
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
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center"
  },
  errorText: {
    color: "#B3261E"
  }
});
