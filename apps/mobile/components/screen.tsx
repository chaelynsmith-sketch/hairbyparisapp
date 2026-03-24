import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.glowTop, { backgroundColor: theme.glowTop }]} />
      <View style={[styles.glowSide, { backgroundColor: theme.glowSide }]} />
      <View style={[styles.glowBottom, { backgroundColor: theme.glowBottom }]} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20
  },
  inner: {
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    gap: 20
  },
  glowTop: {
    position: "absolute",
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 999
  },
  glowSide: {
    position: "absolute",
    top: 260,
    left: -90,
    width: 180,
    height: 180,
    borderRadius: 999
  },
  glowBottom: {
    position: "absolute",
    bottom: -70,
    right: 40,
    width: 260,
    height: 260,
    borderRadius: 999
  }
});
