import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function ScreenHeader({ title, subtitle, actionLabel = "Close", onActionPress }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.copy}>
        <View style={[styles.eyebrowBar, { backgroundColor: theme.highlight }]} />
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
      </View>
      {onActionPress ? (
        <Pressable onPress={onActionPress} style={[styles.action, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.actionText, { color: theme.text }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14
  },
  copy: {
    gap: 8
  },
  eyebrowBar: {
    width: 64,
    height: 6,
    borderRadius: 999
  },
  title: {
    fontSize: 30,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22
  },
  action: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700"
  }
});
