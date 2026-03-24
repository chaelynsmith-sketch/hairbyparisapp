import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Review } from "@/types";

export function ReviewCard({ review }: { review: Review }) {
  const theme = useTheme();
  const authorName = review.user ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() : "Customer";

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.name, { color: theme.text }]}>{authorName || "Customer"}</Text>
          <Text style={{ color: theme.muted }}>
            {"★".repeat(review.rating)} {review.verifiedPurchase ? "• Verified purchase" : ""}
          </Text>
        </View>
      </View>
      {review.title ? <Text style={[styles.title, { color: theme.text }]}>{review.title}</Text> : null}
      {review.comment ? <Text style={{ color: theme.text, lineHeight: 22 }}>{review.comment}</Text> : null}
      {review.media?.length ? (
        <View style={styles.mediaRow}>
          {review.media.map((item) => (
            <Image key={item.url} source={{ uri: item.url }} style={styles.mediaImage} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 15, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "700" },
  mediaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  mediaImage: { width: 88, height: 88, borderRadius: 14 }
});
