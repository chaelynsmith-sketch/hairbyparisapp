import { useMemo, useState } from "react";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { register, resendRegistrationOtp, verifyRegistration } from "@/services/auth-service";
import { useSessionStore } from "@/store/session-store";

const passwordChecks = [
  { label: "14+ characters", test: (value: string) => value.length >= 14 },
  { label: "1 letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { label: "1 number", test: (value: string) => /[0-9]/.test(value) },
  { label: "1 special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) }
];

export default function RegisterScreen() {
  const theme = useTheme();
  const setSession = useSessionStore((state) => state.setSession);
  const [pendingUserId, setPendingUserId] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
  const [otps, setOtps] = useState({ emailOtp: "", phoneOtp: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const passwordReady = useMemo(() => passwordChecks.every((check) => check.test(form.password)), [form.password]);

  const mutation = useMutation({
    mutationFn: () =>
      register({
        ...form,
        email: form.email,
        phone: form.phone,
        storeSlug: "hair-by-paris-global",
        country: "ZA",
        currency: "ZAR",
        preferredLanguage: "en"
      }),
    onSuccess: (data) => {
      setPendingUserId(data.userId);
      const emailPreview = data.verification?.email?.otpPreview;
      const phonePreview = data.verification?.phone?.otpPreview;
      setOtpPreview(
        [emailPreview ? `Email OTP: ${emailPreview}` : "", phonePreview ? `Phone OTP: ${phonePreview}` : ""]
          .filter(Boolean)
          .join(" | ")
      );
    }
  });
  const verifyMutation = useMutation({
    mutationFn: () => verifyRegistration({ userId: pendingUserId, ...otps }),
    onSuccess: (data) => {
      setSession(data);
      router.replace("/(tabs)");
    }
  });
  const resendMutation = useMutation({
    mutationFn: () => resendRegistrationOtp(pendingUserId),
    onSuccess: (data) => {
      const emailPreview = data.verification?.email?.otpPreview;
      const phonePreview = data.verification?.phone?.otpPreview;
      setOtpPreview(
        [emailPreview ? `Email OTP: ${emailPreview}` : "", phonePreview ? `Phone OTP: ${phonePreview}` : ""]
          .filter(Boolean)
          .join(" | ")
      );
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title={pendingUserId ? "Verify your account" : "Create account"}
        subtitle={
          pendingUserId
            ? "Enter the OTP sent to your email and the OTP sent to your phone. Both are required before your account opens."
            : "Hair By Paris is retail-only. Create one verified account with both your email and South African phone number."
        }
        actionLabel="Back to sign in"
        onActionPress={() => router.replace("/auth/login")}
      />
      {!pendingUserId ? (
        <>
          {([
            ["firstName", "First name"],
            ["lastName", "Last name"],
            ["username", "Username"],
            ["email", "Email address"],
            ["phone", "Phone number"],
            ["password", "Password"]
          ] as const).map(([field, label]) => (
            <View key={field} style={styles.fieldWrap}>
              <TextInput
                value={form[field]}
                onChangeText={(value) => setForm((current) => ({ ...current, [field]: value }))}
                placeholder={label}
                placeholderTextColor={theme.muted}
                autoCapitalize={field === "firstName" || field === "lastName" ? "words" : "none"}
                keyboardType={field === "phone" ? "phone-pad" : field === "email" ? "email-address" : "default"}
                secureTextEntry={field === "password" && !showPassword}
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              />
              {field === "password" ? (
                <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.passwordToggle}>
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>
                    {showPassword ? "Hide password" : "Show password"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <View style={[styles.policyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {passwordChecks.map((check) => {
              const valid = check.test(form.password);
              return (
                <Text key={check.label} style={{ color: valid ? theme.primary : theme.muted }}>
                  {valid ? "OK" : "--"} {check.label}
                </Text>
              );
            })}
          </View>
          {mutation.error ? <Text style={styles.errorText}>{(mutation.error as any)?.response?.data?.message || "Unable to create account"}</Text> : null}
          <Pressable
            onPress={() => mutation.mutate()}
            disabled={!passwordReady || mutation.isPending}
            style={[styles.button, { backgroundColor: theme.primary, opacity: !passwordReady || mutation.isPending ? 0.55 : 1 }]}
          >
            <Text style={styles.buttonText}>{mutation.isPending ? "Sending OTPs..." : "Create and send OTPs"}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            value={otps.emailOtp}
            onChangeText={(value) => setOtps((current) => ({ ...current, emailOtp: value }))}
            placeholder="Email OTP"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          />
          <TextInput
            value={otps.phoneOtp}
            onChangeText={(value) => setOtps((current) => ({ ...current, phoneOtp: value }))}
            placeholder="Phone OTP"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          />
          {otpPreview ? <Text style={{ color: theme.muted }}>{otpPreview}</Text> : null}
          {verifyMutation.error ? <Text style={styles.errorText}>{(verifyMutation.error as any)?.response?.data?.message || "Unable to verify account"}</Text> : null}
          <Pressable onPress={() => verifyMutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
            <Text style={styles.buttonText}>{verifyMutation.isPending ? "Verifying..." : "Activate account"}</Text>
          </Pressable>
          <Pressable onPress={() => resendMutation.mutate()} style={[styles.secondaryButton, { borderColor: theme.border }]}>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>{resendMutation.isPending ? "Resending..." : "Resend OTPs"}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    gap: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  passwordToggle: {
    alignSelf: "flex-start"
  },
  policyCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 6
  },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center"
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E"
  }
});
