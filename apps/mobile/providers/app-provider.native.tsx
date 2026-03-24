import { PropsWithChildren, useEffect, useState } from "react";
import { ActivityIndicator, Appearance, StatusBar, StyleSheet, View, useColorScheme } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/services/i18n";
import { AppStripeProvider } from "@/providers/stripe-provider";
import { useSessionStore } from "@/store/session-store";

const queryClient = new QueryClient();

export function AppProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const hasHydrated = useSessionStore((state) => state.hasHydrated);
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const [barStyle, setBarStyle] = useState<"light-content" | "dark-content">(
    systemScheme === "dark" ? "light-content" : "dark-content"
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setBarStyle(colorScheme === "dark" ? "light-content" : "dark-content");
    });

    return () => subscription.remove();
  }, []);

  const content = (
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

  return (
    <AppStripeProvider publishableKey={stripePublishableKey}>
      {content}
    </AppStripeProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
