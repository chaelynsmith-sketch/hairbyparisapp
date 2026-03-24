import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchPolicyPage } from "@/services/policy-service";

export default function PrivacyPolicyScreen() {
  const theme = useTheme();
  const { data: policy } = useQuery({
    queryKey: ["policy-page", "privacy"],
    queryFn: () => fetchPolicyPage("privacy")
  });

  return (
    <Screen>
      <ScreenHeader
        title={policy?.title || "Privacy policy"}
        subtitle={policy?.subtitle || "How Hair By Paris collects, uses, and protects customer information."}
        actionLabel="Back to profile"
        onActionPress={() => router.replace("/(tabs)/profile")}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {(policy?.sections || []).map((section) => (
          <View key={section.title} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{section.title}</Text>
            <Text style={{ color: theme.muted, lineHeight: 22 }}>{section.body}</Text>
          </View>
        ))}
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
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "700"
  }
});
