import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/use-theme";
import { useSessionStore } from "@/store/session-store";

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const cartCount = useSessionStore((state) => state.cartCount);
  const wishlistCount = useSessionStore((state) => state.wishlist.length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: "transparent",
          borderRadius: 26,
          marginHorizontal: 12,
          marginBottom: 12,
          height: 74,
          paddingTop: 10,
          paddingBottom: 10,
          position: "absolute",
          shadowColor: "#2D1B14",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
          elevation: 10
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t("tabs.shop"),
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: t("tabs.chat"),
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t("tabs.wishlist"),
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="heart" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tabs.cart"),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="shopping-cart" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("tabs.orders"),
          tabBarIcon: ({ color, size }) => <Feather name="truck" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
