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
    gap: 10
  },
  copy: {
    gap: 7
  },
  eyebrowBar: {
    width: 42,
    height: 1
  },
  title: {
    fontFamily: "Georgia",
    fontSize: 26,
    fontWeight: "400",
    letterSpacing: 0.4
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.3
  },
  action: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  actionText: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1.3,
    textTransform: "uppercase"
  }
});
