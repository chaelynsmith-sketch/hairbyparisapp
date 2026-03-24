import { PropsWithChildren } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

type AppStripeProviderProps = PropsWithChildren<{
  publishableKey: string;
}>;

export function AppStripeProvider({ children, publishableKey }: AppStripeProviderProps) {
  const isExpoGo = Constants.appOwnership === "expo";

  if (!publishableKey || isExpoGo) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme="hairbyparis"
    >
      <>{children}</>
    </StripeProvider>
  );
}
