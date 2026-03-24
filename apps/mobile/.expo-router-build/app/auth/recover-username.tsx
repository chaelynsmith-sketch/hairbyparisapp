import { useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { recoverUsername, requestUsernameOtp } from "@/services/auth-service";

export default function RecoverUsernameScreen() {
  const theme = useTheme();
  const [destination, setDestination] = useState("");
  const [destinationType, setDestinationType] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => requestUsernameOtp({ destination, destinationType }),
    onSuccess: (data) => {
      setStatus(data.message);
    }
  });

  const recoverMutation = useMutation({
    mutationFn: () => recoverUsername({ destination, destinationType, otp }),
    onSuccess: (data) => {
      setUsername(data.username);
      setStatus(data.message);
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Recover username"
        subtitle="Send an OTP to your email or phone and reveal the username tied to that account."
        actionLabel="Back to sign in"
        onActionPress={() => router.replace("/auth/login")}
      />
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder={destinationType === "email" ? "Email address" : "Phone number"}
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        keyboardType={destinationType === "phone" ? "phone-pad" : "default"}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
      />
      <Pressable
        onPress={() => setDestinationType((current) => (current === "email" ? "phone" : "email"))}
        style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
      >
        <Text style={{ color: theme.text, fontWeight: "700" }}>
          Use {destinationType === "email" ? "phone" : "email"} instead
        </Text>
      </Pressable>
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
      {status ? <Text style={{ color: theme.muted }}>{status}</Text> : null}
      {username ? <Text style={{ color: theme.primary, fontWeight: "700" }}>Username: {username}</Text> : null}
      {requestMutation.error || recoverMutation.error ? (
        <Text style={styles.errorText}>
          {((recoverMutation.error || requestMutation.error) as any)?.response?.data?.message || "Unable to recover username"}
        </Text>
      ) : null}
      <Pressable onPress={() => recoverMutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
        <Text style={styles.buttonText}>Reveal username</Text>
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
