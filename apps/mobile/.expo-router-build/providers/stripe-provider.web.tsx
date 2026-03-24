import { PropsWithChildren } from "react";

type AppStripeProviderProps = PropsWithChildren<{
  publishableKey: string;
}>;

export function AppStripeProvider({ children }: AppStripeProviderProps) {
  return <>{children}</>;
}
