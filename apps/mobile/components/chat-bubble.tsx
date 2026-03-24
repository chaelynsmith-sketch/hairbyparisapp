import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";

type ChatBubbleProps = {
  role: "user" | "assistant";
  text: string;
};

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const theme = useTheme();
  const isAssistant = role === "assistant";

  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: isAssistant ? theme.card : theme.primary,
          alignSelf: isAssistant ? "flex-start" : "flex-end"
        }
      ]}
    >
      <Text style={{ color: isAssistant ? theme.text : "#FFFFFF", lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18
  }
});
