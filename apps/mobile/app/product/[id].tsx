import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ReviewCard } from "@/components/review-card";
import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { addToCart } from "@/services/cart-service";
import { createReview, fetchProduct, fetchReviews } from "@/services/catalog-service";
import { uploadMedia } from "@/services/upload-service";
import { useSessionStore } from "@/store/session-store";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const user = useSessionStore((state) => state.user);
  const setCartCount = useSessionStore((state) => state.setCartCount);
  const addGuestCartItem = useSessionStore((state) => state.addGuestCartItem);
  const guestCart = useSessionStore((state) => state.guestCart);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlistItem = useSessionStore((state) => state.toggleWishlistItem);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState("");
  const [reviewPreviewImage, setReviewPreviewImage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { data } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id)
  });
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchReviews(id)
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!user) {
        addGuestCartItem(product, 1);
        return Promise.resolve(null);
      }

      return addToCart(id, 1);
    },
    onSuccess: (cart) => {
      if (!user) {
        const nextCount = guestCart.reduce((sum, item) => sum + item.quantity, 0) + 1;
        setCartCount(nextCount);
        setCartError("");
        setCartMessage("Added to guest cart.");
        return;
      }

      setCartCount(cart?.items?.length || 0);
      setCartError("");
      setCartMessage("Added to cart.");
    },
    onError: (error: any) => {
      setCartMessage("");
      setCartError(error?.response?.data?.message || error?.message || "Unable to add item to cart.");
    }
  });
  const reviewMutation = useMutation({
    mutationFn: () =>
      createReview({
        productId: id,
        rating: 5,
        title: reviewTitle,
        comment: reviewComment,
        media: reviewImage ? [{ url: reviewImage, type: "image" }] : []
      }),
    onSuccess: async () => {
      setReviewTitle("");
      setReviewComment("");
      setReviewImage("");
      setReviewPreviewImage("");
      await refetchReviews();
    }
  });

  const product = data?.product;
  const isWishlisted = wishlist.includes(id);
  const galleryImages: { url: string; type: string }[] = product?.media || [];

  async function pickReviewImage() {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async () => {
        const file = input.files?.[0];

        if (!file) {
          return;
        }

        setReviewPreviewImage(URL.createObjectURL(file));
        const media = await uploadMedia("review-media", file);
        setReviewImage(media.url);
      };

      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8
    });

    if (result.canceled) {
      return;
    }

    const media = await uploadMedia("review-media", result.assets[0]);
    setReviewPreviewImage(result.assets[0].uri);
    setReviewImage(media.url);
  }

  if (!product) {
    return (
      <Screen>
        <Text style={{ color: theme.text }}>Loading product...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.pageContent}>
        <ScreenHeader
          title="Product details"
          subtitle="Review the item, read customer feedback, or jump back to the catalog."
          actionLabel="Back to shop"
          onActionPress={() => router.replace("/(tabs)/shop")}
        />
        <View style={styles.heroWrap}>
          {!galleryImages.length ? (
            <View style={[styles.emptyImageHero, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Feather name="image" size={36} color={theme.muted} />
              <Text style={{ color: theme.text, fontWeight: "700" }}>No product image yet</Text>
              <Text style={{ color: theme.muted }}>Add product media from the admin catalog manager.</Text>
            </View>
          ) : galleryImages[selectedImageIndex]?.type === "video" ? (
            Platform.OS === "web" ? (
              <video
                src={galleryImages[selectedImageIndex]?.url}
                style={styles.videoHero as any}
                controls
                playsInline
              />
            ) : (
              <View style={[styles.videoFallback, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ color: theme.text, fontWeight: "700" }}>Product video</Text>
                <Text style={{ color: theme.muted }}>Video playback is available on web.</Text>
              </View>
            )
          ) : (
            <Image
              source={{ uri: galleryImages[selectedImageIndex]?.url || galleryImages[0]?.url }}
              style={styles.image}
            />
          )}
          <View style={[styles.categoryBadge, { backgroundColor: theme.spotlight }]}>
            <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>{product.category}</Text>
          </View>
        </View>
        {galleryImages.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.galleryRow}>
              {galleryImages.map((media, index) => (
                <Pressable
                  key={`${media.url}-${index}`}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.galleryThumbWrap,
                    {
                      borderColor: selectedImageIndex === index ? theme.primary : theme.border,
                      backgroundColor: selectedImageIndex === index ? theme.spotlight : theme.card
                    }
                  ]}
                >
                  {media.type === "video" ? (
                    <View style={[styles.galleryVideoThumb, { backgroundColor: theme.canvas }]}>
                      <Text style={{ color: theme.text, fontWeight: "700" }}>Video</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: media.url }} style={styles.galleryThumb} />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.content}>
            <Text style={[styles.name, { color: theme.text }]}>{product.name}</Text>
            <Text style={[styles.price, { color: theme.primary }]}>
              {product.pricing.baseCurrency} {(product.pricing.saleAmount || product.pricing.amount).toFixed(2)}
            </Text>
            <Text style={{ color: theme.text, lineHeight: 24 }}>{product.description}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Texture</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{product.attributes?.texture || "Signature"}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Length</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{product.attributes?.length || "Standard"}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.canvas }]}>
              <Text style={[styles.statLabel, { color: theme.muted }]}>Stock</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{product.inventory.quantity}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => toggleWishlistItem(id)}
            style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.card }]}
          >
            <Feather name="heart" size={18} color={isWishlisted ? theme.primary : theme.text} />
            <Text style={{ color: theme.text, fontWeight: "700" }}>{isWishlisted ? "Saved" : "Save"}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setCartMessage("");
              setCartError("");
              mutation.mutate();
            }}
            style={[styles.button, { backgroundColor: theme.primary, opacity: mutation.isPending ? 0.7 : 1 }]}
          >
            <Text style={styles.buttonText}>{mutation.isPending ? "Adding..." : "Add to cart"}</Text>
          </Pressable>
        </View>
        {cartMessage ? <Text style={[styles.feedbackText, { color: theme.primary }]}>{cartMessage}</Text> : null}
        {cartError ? <Text style={[styles.feedbackText, styles.errorText]}>{cartError}</Text> : null}

        <View style={[styles.reviewSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.reviewHeading, { color: theme.text }]}>Customer reviews</Text>
          {reviews.length ? reviews.map((review) => <ReviewCard key={review._id} review={review} />) : <Text style={{ color: theme.muted }}>No reviews yet.</Text>}
        </View>

        {user ? (
          <View style={[styles.reviewSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.reviewHeading, { color: theme.text }]}>Write a review</Text>
            <TextInput
              value={reviewTitle}
              onChangeText={setReviewTitle}
              placeholder="Review title"
              placeholderTextColor={theme.muted}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
            />
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience"
              placeholderTextColor={theme.muted}
              multiline
              style={[styles.input, styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
            />
            <Pressable onPress={pickReviewImage} style={[styles.secondaryButton, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>{reviewImage ? "Replace review photo" : "Upload review photo"}</Text>
            </Pressable>
            {reviewPreviewImage || reviewImage ? <Image source={{ uri: reviewPreviewImage || reviewImage }} style={styles.reviewPreview} /> : null}
            <Pressable onPress={() => reviewMutation.mutate()} style={[styles.button, { backgroundColor: theme.primary }]}>
              <Text style={styles.buttonText}>Submit review</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    gap: 16,
    paddingBottom: 112
  },
  heroWrap: {
    position: "relative"
  },
  image: {
    width: "100%",
    height: 360,
    borderRadius: 28
  },
  videoHero: {
    width: "100%",
    height: 360,
    borderRadius: 28,
    objectFit: "cover"
  },
  videoFallback: {
    width: "100%",
    height: 360,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20
  },
  emptyImageHero: {
    width: "100%",
    height: 360,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20
  },
  galleryRow: {
    flexDirection: "row",
    gap: 10
  },
  galleryThumbWrap: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 4
  },
  galleryThumb: {
    width: 86,
    height: 86,
    borderRadius: 14
  },
  galleryVideoThumb: {
    width: 86,
    height: 86,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  categoryBadge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9
  },
  contentCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    gap: 18
  },
  content: {
    gap: 10
  },
  name: {
    fontSize: 30,
    fontWeight: "800"
  },
  price: {
    fontSize: 24,
    fontWeight: "700"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 12
  },
  secondaryAction: {
    minWidth: 116,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16
  },
  reviewSection: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12
  },
  reviewHeading: {
    fontSize: 22,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center"
  },
  reviewPreview: {
    width: 120,
    height: 120,
    borderRadius: 18
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "700"
  },
  errorText: {
    color: "#B3261E"
  }
});
