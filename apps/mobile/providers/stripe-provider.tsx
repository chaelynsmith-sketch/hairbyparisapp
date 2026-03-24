import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

type AppStripeProviderProps = PropsWithChildren<{
  publishableKey: string;
}>;

export function AppStripeProvider({ children, publishableKey }: AppStripeProviderProps) {
  const isExpoGo = Constants.appOwnership === "expo";

  if (Platform.OS === "web" || isExpoGo || !publishableKey) {
    return <>{children}</>;
  }

  const { StripeProvider } = require("@stripe/stripe-react-native") as {
    StripeProvider: ComponentType<{
      publishableKey: string;
      urlScheme?: string;
      children?: ReactNode;
    }>;
  };

  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme="hairbyparis"
    >
      <>{children}</>
    </StripeProvider>
  );
}
