import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchCheckoutSummary, fetchPaymentMethods, placeOrder } from "@/services/order-service";
import { useSessionStore } from "@/store/session-store";

const SUPPORTED_CHECKOUT_PROVIDERS = ["payfast"];

function formatPaymentLabel(value?: string) {
  if (!value) {
    return "Pending";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CheckoutScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const setCartCount = useSessionStore((state) => state.setCartCount);
  const savedShippingAddress = useSessionStore((state) => state.savedShippingAddress);
  const setSavedShippingAddress = useSessionStore((state) => state.setSavedShippingAddress);
  const [paymentProvider, setPaymentProvider] = useState("payfast");
  const [paymentMethodType, setPaymentMethodType] = useState("payfast");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<null | { orderId: string; orderNumber: string }>(null);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: user?.country || "ZA",
    phone: user?.phone || ""
  });
  const { data } = useQuery({
    queryKey: ["checkout-summary", appliedVoucherCode],
    queryFn: () => fetchCheckoutSummary(appliedVoucherCode || undefined)
  });
  const { data: enabledPaymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods
  });
  const methodCatalog = useMemo(
    () =>
      ({
        payfast: {
          label: "PayFast",
          description: "Local South African payment flow for launch readiness."
        }
      }) as Record<string, { label: string; description: string }>,
    []
  );
  const methods = enabledPaymentMethods
    .filter((value) => SUPPORTED_CHECKOUT_PROVIDERS.includes(value))
    .map((value) => ({ value, ...(methodCatalog[value] || { label: formatPaymentLabel(value), description: "Payment method available for this store." }) }))
    .filter((item) => Boolean(item.value));
  const checkoutOptions = methods.map(({ value, label, description }) => ({
    key: value,
    provider: value,
    methodType: value,
    label,
    description
  }));

  useEffect(() => {
    if (!checkoutOptions.length) {
      return;
    }

    const matchingOption = checkoutOptions.find(
      (item) => item.provider === paymentProvider && item.methodType === paymentMethodType
    );

    if (!matchingOption) {
      setPaymentProvider(checkoutOptions[0].provider);
      setPaymentMethodType(checkoutOptions[0].methodType);
    }
  }, [checkoutOptions, paymentMethodType, paymentProvider]);

  useEffect(() => {
    setShippingAddress((current) => ({
      ...current,
      recipientName:
        current.recipientName ||
        savedShippingAddress?.recipientName ||
        (user ? `${user.firstName} ${user.lastName}`.trim() : ""),
      line1: current.line1 || savedShippingAddress?.line1 || "",
      line2: current.line2 || savedShippingAddress?.line2 || "",
      city: current.city || savedShippingAddress?.city || "",
      state: current.state || savedShippingAddress?.state || "",
      postalCode: current.postalCode || savedShippingAddress?.postalCode || "",
      country: current.country || savedShippingAddress?.country || user?.country || "ZA",
      phone: current.phone || savedShippingAddress?.phone || user?.phone || ""
    }));
  }, [savedShippingAddress, user]);

  const hasValidShippingAddress = Boolean(
    shippingAddress.recipientName.trim() &&
      shippingAddress.line1.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.postalCode.trim() &&
      shippingAddress.country.trim()
  );

  const orderMutation = useMutation({
    mutationFn: () =>
      placeOrder({
        paymentProvider,
        paymentMethodType,
        forceDuplicate: false,
        couponCode: appliedVoucherCode || undefined,
        shippingAddress
      }),
    onSuccess: (result) => {
      const paymentState = formatPaymentLabel(result.paymentIntent?.status);
      setSavedShippingAddress(shippingAddress);
      const redirectUrl = result.paymentIntent?.redirectUrl;

      if (paymentProvider === "payfast" && redirectUrl) {
        setStatusMessage(`Order ${result.order.orderNumber} created. Redirecting to PayFast...`);
        setErrorMessage("");
        setDuplicateWarning(null);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["checkout-summary"] });

        if (Platform.OS === "web") {
          window.location.href = redirectUrl;
          return;
        }

        Linking.openURL(redirectUrl);
        return;
      }

      setStatusMessage(
        result.duplicateAttempt
          ? `Duplicate order confirmed. New order ${result.order.orderNumber} placed. Payment status: ${paymentState}.`
          : `Order ${result.order.orderNumber} placed. Payment status: ${paymentState}.`
      );
      setErrorMessage("");
      setDuplicateWarning(null);
      setCartCount(0);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["checkout-summary"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      router.replace({ pathname: "/orders/[id]", params: { id: result.order._id } });
    },
    onError: (error: any) => {
      setStatusMessage("");
      if (error?.response?.status === 409 && error?.response?.data?.details?.duplicateAttempt) {
        setDuplicateWarning({
          orderId: error.response.data.details.existingOrderId,
          orderNumber: error.response.data.details.existingOrderNumber
        });
        setErrorMessage("");
        setStatusMessage("This cart was already submitted. Decide whether to stop the duplicate or continue with a second order.");
        return;
      }

      setDuplicateWarning(null);
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to place order.");
    }
  });
  const confirmDuplicateMutation = useMutation({
    mutationFn: () =>
      placeOrder({
        paymentProvider,
        paymentMethodType,
        forceDuplicate: true,
        couponCode: appliedVoucherCode || undefined,
        shippingAddress
      }),
    onSuccess: (result) => {
      const paymentState = formatPaymentLabel(result.paymentIntent?.status);
      setSavedShippingAddress(shippingAddress);
      setStatusMessage(`Duplicate order confirmed. New order ${result.order.orderNumber} placed. Payment status: ${paymentState}.`);
      setErrorMessage("");
      setDuplicateWarning(null);
      setCartCount(0);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["checkout-summary"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      router.replace({ pathname: "/orders/[id]", params: { id: result.order._id } });
    },
    onError: (error: any) => {
      setStatusMessage("");
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to place duplicate order.");
    }
  });

  const currency = data?.totals?.currency || "ZAR";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Checkout"
        subtitle="Review your totals, choose a payment method, and place the order."
        actionLabel="Back to orders"
        onActionPress={() => router.replace("/(tabs)/orders")}
      />
      <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>Shipping address</Text>
        {savedShippingAddress ? (
          <Pressable
            onPress={() => {
              setShippingAddress(savedShippingAddress);
              setStatusMessage("Saved shipping address applied.");
              setErrorMessage("");
            }}
            style={styles.linkButton}
          >
            <Text style={{ color: theme.primary, fontWeight: "700" }}>Use saved address</Text>
          </Pressable>
        ) : null}
        <TextInput
          value={shippingAddress.recipientName}
          onChangeText={(value) => setShippingAddress((current) => ({ ...current, recipientName: value }))}
          placeholder="Recipient name"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <TextInput
          value={shippingAddress.line1}
          onChangeText={(value) => setShippingAddress((current) => ({ ...current, line1: value }))}
          placeholder="Address line 1"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <TextInput
          value={shippingAddress.line2}
          onChangeText={(value) => setShippingAddress((current) => ({ ...current, line2: value }))}
          placeholder="Address line 2 (optional)"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
        <View style={styles.row}>
          <TextInput
            value={shippingAddress.city}
            onChangeText={(value) => setShippingAddress((current) => ({ ...current, city: value }))}
            placeholder="City"
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.rowInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
          <TextInput
            value={shippingAddress.state}
            onChangeText={(value) => setShippingAddress((current) => ({ ...current, state: value }))}
            placeholder="Province / State"
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.rowInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
        </View>
        <View style={styles.row}>
          <TextInput
            value={shippingAddress.postalCode}
            onChangeText={(value) => setShippingAddress((current) => ({ ...current, postalCode: value }))}
            placeholder="Postal code"
            placeholderTextColor={theme.muted}
            style={[styles.input, styles.rowInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
          <TextInput
            value={shippingAddress.country}
            onChangeText={(value) => setShippingAddress((current) => ({ ...current, country: value.toUpperCase() }))}
            placeholder="Country code"
            placeholderTextColor={theme.muted}
            autoCapitalize="characters"
            maxLength={2}
            style={[styles.input, styles.rowInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
          />
        </View>
        <TextInput
          value={shippingAddress.phone}
          onChangeText={(value) => setShippingAddress((current) => ({ ...current, phone: value }))}
          placeholder="Phone number (optional)"
          placeholderTextColor={theme.muted}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
        />
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={{ color: theme.text }}>Subtotal: {currency} {data?.totals?.subtotal?.toFixed?.(2) || "0.00"}</Text>
        <Text style={{ color: theme.text }}>Shipping: {currency} {data?.totals?.shipping?.toFixed?.(2) || "0.00"}</Text>
        <Text style={{ color: theme.text }}>Tax: {currency} {data?.totals?.tax?.toFixed?.(2) || "0.00"}</Text>
        {(data?.totals?.discount || 0) > 0 ? (
          <Text style={{ color: theme.primary }}>
            Voucher discount: -{currency} {data?.totals?.discount?.toFixed?.(2) || "0.00"}
          </Text>
        ) : null}
        <Text style={[styles.total, { color: theme.primary }]}>
          Total: {currency} {data?.totals?.grandTotal?.toFixed?.(2) || "0.00"}
        </Text>
      </View>
      <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>Voucher code</Text>
        <Text style={{ color: theme.muted }}>
          Add a voucher before payment to update your checkout total.
        </Text>
        <View style={styles.voucherRow}>
          <TextInput
            value={voucherCode}
            onChangeText={(value) => setVoucherCode(value.toUpperCase())}
            placeholder="Enter voucher code"
            placeholderTextColor={theme.muted}
            autoCapitalize="characters"
            style={[
              styles.input,
              styles.voucherInput,
              { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }
            ]}
          />
          <Pressable
            onPress={() => {
              const nextCode = voucherCode.trim().toUpperCase();
              setAppliedVoucherCode(nextCode);
              setVoucherCode(nextCode);
              setStatusMessage(nextCode ? `Voucher ${nextCode} applied to checkout.` : "");
              setErrorMessage("");
            }}
            style={[styles.voucherButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.buttonText}>Apply</Text>
          </Pressable>
        </View>
        {appliedVoucherCode ? (
          <View style={styles.voucherMeta}>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>
              Applied: {appliedVoucherCode}
            </Text>
            <Pressable
              onPress={() => {
                setAppliedVoucherCode("");
                setVoucherCode("");
                setStatusMessage("Voucher removed from checkout.");
                setErrorMessage("");
              }}
            >
              <Text style={{ color: theme.muted, fontWeight: "700" }}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={[styles.noteCard, { backgroundColor: theme.spotlight, borderColor: theme.border }]}>
        <Text style={[styles.noteTitle, { color: theme.text }]}>Payment setup</Text>
        <Text style={{ color: theme.muted }}>
          Checkout is configured for PayFast. When you place the order, you will be redirected to PayFast to complete payment.
        </Text>
      </View>
      {checkoutOptions.length ? (
        <View style={styles.methods}>
          {checkoutOptions.map(({ key, provider, methodType, label, description }) => (
            <Pressable
              key={key}
              onPress={() => {
                setPaymentProvider(provider);
                setPaymentMethodType(methodType);
              }}
              style={[
                styles.methodCard,
                {
                  backgroundColor:
                    paymentProvider === provider && paymentMethodType === methodType ? theme.spotlight : theme.card,
                  borderColor:
                    paymentProvider === provider && paymentMethodType === methodType ? theme.primary : theme.border
                }
              ]}
            >
              <Text style={[styles.methodTitle, { color: theme.text }]}>{label}</Text>
              <Text style={{ color: theme.muted }}>{description}</Text>
              <Text style={{ color: theme.muted }}>Processed by {formatPaymentLabel(provider)}</Text>
              <Text
                style={{
                  color:
                    paymentProvider === provider && paymentMethodType === methodType ? theme.primary : theme.muted
                }}
              >
                {paymentProvider === provider && paymentMethodType === methodType
                  ? "Selected"
                  : "Tap to use this method"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.noteTitle, { color: theme.text }]}>No payment methods available</Text>
          <Text style={{ color: theme.muted }}>
            This store does not currently have any enabled payment methods. Checkout is blocked until one is enabled.
          </Text>
        </View>
      )}
      {statusMessage ? <Text style={[styles.feedbackText, { color: theme.primary }]}>{statusMessage}</Text> : null}
      {errorMessage ? <Text style={[styles.feedbackText, styles.errorText]}>{errorMessage}</Text> : null}
      {duplicateWarning ? (
        <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.noteTitle, { color: theme.text }]}>Possible duplicate order</Text>
          <Text style={{ color: theme.muted }}>
            Order {duplicateWarning.orderNumber} is still pending for this same cart. Would you like to stop here or continue with a second order?
          </Text>
          <View style={styles.duplicateActions}>
            <Pressable
              onPress={() => {
                setStatusMessage(`Duplicate order stopped. Pending order ${duplicateWarning.orderNumber} is still active.`);
                setDuplicateWarning(null);
                setErrorMessage("");
              }}
              style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Text style={{ color: theme.text, fontWeight: "700" }}>Stop duplicate order</Text>
            </Pressable>
            <Pressable
              onPress={() => confirmDuplicateMutation.mutate()}
              style={[
                styles.secondaryButton,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.primary,
                  opacity: confirmDuplicateMutation.isPending ? 0.7 : 1
                }
              ]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                {confirmDuplicateMutation.isPending ? "Continuing..." : "Continue anyway"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/orders/[id]", params: { id: duplicateWarning.orderId } })}
            style={styles.linkButton}
          >
            <Text style={{ color: theme.primary, fontWeight: "700" }}>Open existing pending order</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable
        onPress={() => {
          setStatusMessage("");
          if (!hasValidShippingAddress) {
            setErrorMessage("Complete the shipping address before placing the order.");
            return;
          }
          setErrorMessage("");
          setDuplicateWarning(null);
          orderMutation.mutate();
        }}
        disabled={!checkoutOptions.length || orderMutation.isPending || confirmDuplicateMutation.isPending || !hasValidShippingAddress}
        style={[
          styles.button,
          {
            backgroundColor: theme.primary,
            opacity:
              !checkoutOptions.length || orderMutation.isPending || confirmDuplicateMutation.isPending || !hasValidShippingAddress
                ? 0.55
                : 1
          }
        ]}
      >
        <Text style={styles.buttonText}>
          {!checkoutOptions.length
            ? "No payment method enabled"
            : !hasValidShippingAddress
              ? "Complete shipping address"
              : orderMutation.isPending
                ? "Placing order..."
                : "Place order"}
        </Text>
      </Pressable>
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
    borderRadius: 24,
    padding: 20,
    gap: 8
  },
  total: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700"
  },
  methods: {
    gap: 10
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  methodCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "700"
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
  feedbackText: {
    fontSize: 14,
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E"
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center"
  },
  duplicateActions: {
    flexDirection: "row",
    gap: 10
  },
  linkButton: {
    alignItems: "flex-start"
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  rowInput: {
    flex: 1
  },
  voucherRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center"
  },
  voucherInput: {
    flex: 1
  },
  voucherButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  voucherMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  }
});
