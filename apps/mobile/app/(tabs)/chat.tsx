import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ChatBubble } from "@/components/chat-bubble";
import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";
import { askAssistant } from "@/services/ai-service";
import { useSessionStore } from "@/store/session-store";

export default function ChatScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const setRecommendations = useSessionStore((state) => state.setRecommendations);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Tell me your texture preference, desired length, and budget, and I’ll narrow the catalog."
    }
  ]);

  const mutation = useMutation({
    mutationFn: (content: string) => askAssistant(content),
    onSuccess: (data, variables) => {
      setMessages((current) => [
        ...current,
        { role: "user", text: variables },
        { role: "assistant", text: data.answer }
      ]);
      setRecommendations(data.recommendedProducts || []);
      setMessage("");
    }
  });

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t("common.chatTitle")}</Text>
      <View style={styles.thread}>
        {messages.map((item, index) => (
          <ChatBubble key={`${item.role}-${index}`} role={item.role} text={item.text} />
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask for bundles, scalp care, tools, or styling guidance"
          placeholderTextColor={theme.muted}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
        />
        <Pressable
          onPress={() => message.trim() && mutation.mutate(message.trim())}
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  thread: {
    gap: 12
  },
  inputRow: {
    gap: 12
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 120,
    textAlignVertical: "top"
  },
  sendButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
