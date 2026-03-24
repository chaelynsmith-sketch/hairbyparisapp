import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchPolicyPage, PolicyPage, updatePolicyPage } from "@/services/policy-service";

const policyOptions: PolicyPage["key"][] = ["privacy", "terms", "refunds"];

export default function AdminPoliciesScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [policyKey, setPolicyKey] = useState<PolicyPage["key"]>("privacy");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [sectionsText, setSectionsText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { data: policy } = useQuery({
    queryKey: ["policy-page", policyKey],
    queryFn: () => fetchPolicyPage(policyKey)
  });

  useEffect(() => {
    if (!policy) {
      return;
    }

    setTitle(policy.title);
    setSubtitle(policy.subtitle);
    setSectionsText(
      policy.sections
        .map((section) => `${section.title}\n${section.body}`)
        .join("\n\n---\n\n")
    );
  }, [policy]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePolicyPage(policyKey, {
        title,
        subtitle,
        sections: sectionsText
          .split("\n\n---\n\n")
          .map((chunk) => chunk.trim())
          .filter(Boolean)
          .map((chunk) => {
            const [sectionTitle, ...bodyParts] = chunk.split("\n");
            return {
              title: sectionTitle?.trim() || "Untitled section",
              body: bodyParts.join("\n").trim()
            };
          })
      }),
    onSuccess: () => {
      setStatusMessage("Policy saved.");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["policy-page", policyKey] });
    },
    onError: (error: any) => {
      setStatusMessage("");
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to save policy.");
    }
  });

  return (
    <Screen>
      <ScreenHeader
        title="Manage policies"
        subtitle="Edit the public legal pages shown to customers."
        actionLabel="Back to dashboard"
        onActionPress={() => router.replace("/admin/dashboard")}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.optionRow}>
          {policyOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setPolicyKey(option);
                setStatusMessage("");
                setErrorMessage("");
              }}
              style={[
                styles.optionPill,
                {
                  backgroundColor: policyKey === option ? theme.primary : theme.card,
                  borderColor: policyKey === option ? theme.primary : theme.border
                }
              ]}
            >
              <Text style={{ color: policyKey === option ? "#FFFFFF" : theme.text }}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Page title"
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Page subtitle"
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
          <Text style={{ color: theme.muted }}>
            Use `---` between sections. Put the section title on the first line, then the body below it.
          </Text>
          <TextInput
            value={sectionsText}
            onChangeText={setSectionsText}
            placeholder="Section title&#10;Section body"
            placeholderTextColor={theme.muted}
            multiline
            style={[styles.input, styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
          {statusMessage ? <Text style={{ color: theme.primary, fontWeight: "700" }}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={{ color: "#B3261E", fontWeight: "700" }}>{errorMessage}</Text> : null}
          <Pressable
            onPress={() => saveMutation.mutate()}
            style={[styles.button, { backgroundColor: theme.primary, opacity: saveMutation.isPending ? 0.7 : 1 }]}
          >
            <Text style={styles.buttonText}>{saveMutation.isPending ? "Saving..." : "Save policy"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 24
  },
  card: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  optionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textarea: {
    minHeight: 260,
    textAlignVertical: "top"
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
