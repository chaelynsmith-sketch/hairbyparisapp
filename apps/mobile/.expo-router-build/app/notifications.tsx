import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchMyNotifications, markNotificationRead } from "@/services/notification-service";

export default function NotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchMyNotifications,
    refetchOnMount: "always"
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle="Order updates, promotions, and account alerts live here."
        actionLabel="Back to profile"
        onActionPress={() => router.replace("/(tabs)/profile")}
      />
      <View style={styles.list}>
        {notifications.map((notification: any) => (
          <Pressable
            key={notification._id}
            onPress={() => !notification.readAt && markReadMutation.mutate(notification._id)}
            style={[
              styles.card,
              {
                backgroundColor: notification.readAt ? theme.card : theme.spotlight,
                borderColor: notification.readAt ? theme.border : theme.primary
              }
            ]}
          >
            <Text style={[styles.title, { color: theme.text }]}>{notification.title}</Text>
            <Text style={{ color: theme.muted }}>{notification.body}</Text>
            <Text style={{ color: theme.muted }}>
              {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
            </Text>
          </Pressable>
        ))}
        {!notifications.length ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>No notifications yet</Text>
            <Text style={{ color: theme.muted }}>Order updates will appear here after new activity.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8
  },
  title: {
    fontSize: 17,
    fontWeight: "700"
  }
});
