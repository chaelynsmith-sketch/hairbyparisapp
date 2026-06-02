import { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, Appearance, StatusBar, StyleSheet, View, useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/services/i18n";
import { useSessionStore } from "@/store/session-store";

const queryClient = new QueryClient();

export function AppProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const [barStyle, setBarStyle] = useState<"light-content" | "dark-content">(
    systemScheme === "dark" ? "light-content" : "dark-content"
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setBarStyle(colorScheme === "dark" ? "light-content" : "dark-content");
    });

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle={barStyle} />
      {hasHydrated ? (
        children
      ) : (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
