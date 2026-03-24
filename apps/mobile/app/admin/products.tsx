import { router } from "expo-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { ScrollView, Pressable, StyleSheet, Text, TextInput, View, Image, Platform } from "react-native";

import { Screen } from "@/components/screen";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/hooks/use-theme";
import { fetchAdminProducts, fetchSuppliers } from "@/services/admin-service";
import { createProduct, updateProduct } from "@/services/catalog-service";
import { uploadMedia } from "@/services/upload-service";

const defaultCategories = ["Hair Products", "Hair Extensions", "Tools", "Wigs"];

const emptyForm = {
  _id: "",
  name: "",
  slug: "",
  category: "Hair Products",
  description: "",
  amount: "",
  saleAmount: "",
  sku: "",
  quantity: "",
  imageUrl: "",
  supplierId: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminProductsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAdminProducts
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers
  });
  const categoryOptions = Array.from(
    new Set([...defaultCategories, ...products.map((product: any) => product.category).filter(Boolean), form.category].filter(Boolean))
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage("");
      setStatusMessage("");

      if (!form.name.trim()) {
        throw new Error("Product name is required.");
      }

      if (!form.description.trim()) {
        throw new Error("Product description is required.");
      }

      if (!form.category.trim()) {
        throw new Error("Category is required.");
      }

      if (!form.sku.trim()) {
        throw new Error("SKU is required.");
      }

      if (Number(form.amount) <= 0) {
        throw new Error("Price must be greater than zero.");
      }

      if (Number(form.quantity) < 0) {
        throw new Error("Stock quantity cannot be negative.");
      }

      const normalizedSlug = form.slug.trim() ? slugify(form.slug) : slugify(form.name);

      const payload = {
        name: form.name,
        slug: normalizedSlug,
        category: form.category,
        description: form.description,
        media: form.imageUrl
          ? [
              {
                type: "image",
                url: form.imageUrl,
                alt: form.name
              }
            ]
          : [],
        pricing: {
          baseCurrency: "ZAR",
          amount: Number(form.amount || 0),
          saleAmount: form.saleAmount ? Number(form.saleAmount) : undefined
        },
        supplierId: form.supplierId || undefined,
        inventory: {
          sku: form.sku,
          quantity: Number(form.quantity || 0),
          lowStockThreshold: 3
        }
      };

      return form._id ? updateProduct(form._id, payload) : createProduct(payload);
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setForm(emptyForm);
      setPreviewImageUrl("");
      setStatusMessage(`${product.name} ${product._id ? "saved" : "created"} successfully.`);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to save product.");
    }
  });

  async function pickProductImage() {
    setErrorMessage("");
    setStatusMessage("");

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async () => {
        const file = input.files?.[0];

        if (!file) {
          return;
        }

        setPreviewImageUrl(URL.createObjectURL(file));
        setStatusMessage("Uploading image...");

        try {
          const media = await uploadMedia("product-media", file);
          setForm((current) => ({ ...current, imageUrl: media.url }));
          setStatusMessage("Image uploaded.");
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload image.");
        }
      };

      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9
    });

    if (result.canceled) {
      return;
    }

    try {
      const media = await uploadMedia("product-media", result.assets[0]);
      setPreviewImageUrl(result.assets[0].uri);
      setForm((current) => ({ ...current, imageUrl: media.url }));
      setStatusMessage("Image uploaded.");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload image.");
    }
  }

  function handleSelectProduct(product: any) {
    setErrorMessage("");
    setStatusMessage(`Editing ${product.name}`);
    setForm({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      amount: String(product.pricing?.amount || ""),
      saleAmount: product.pricing?.saleAmount ? String(product.pricing.saleAmount) : "",
      sku: product.inventory?.sku || "",
      quantity: String(product.inventory?.quantity || ""),
      imageUrl: product.media?.[0]?.url || "",
      supplierId: product.supplierId || ""
    });
    setPreviewImageUrl(product.media?.[0]?.url || "");
  }

  const isEditing = Boolean(form._id);

  return (
    <Screen>
      <ScreenHeader
        title="Catalog manager"
        subtitle="Create products, swap categories, and update descriptions without getting stuck in the form."
        actionLabel={form._id || form.name || form.description ? "Exit editor" : "Back to dashboard"}
        onActionPress={() => {
          if (form._id || form.name || form.description || form.amount || form.sku) {
            setForm(emptyForm);
            setPreviewImageUrl("");
            setErrorMessage("");
            setStatusMessage("Editor cleared.");
            return;
          }

          router.replace("/admin/dashboard");
        }}
      />
      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {isEditing ? "Edit product" : "Create product"}
        </Text>
        <Text style={{ color: theme.muted }}>
          {isEditing ? "Update the selected product and save your changes." : "Create a new product and publish it to the catalog."}
        </Text>
        {statusMessage ? <Text style={[styles.feedbackText, { color: theme.primary }]}>{statusMessage}</Text> : null}
        {errorMessage ? <Text style={[styles.feedbackText, styles.errorText]}>{errorMessage}</Text> : null}
        {[ 
          ["name", "Product name"],
          ["slug", "Slug"],
          ["category", "Category"],
          ["description", "Description"],
          ["amount", "Price"],
          ["saleAmount", "Sale price"],
          ["sku", "SKU"],
          ["quantity", "Stock quantity"]
        ].map(([key, label]) => (
          <TextInput
            key={key}
            value={(form as any)[key]}
            onChangeText={(value) =>
              setForm((current) => ({
                ...current,
                [key]: value,
                ...(key === "name" && !current._id && !current.slug.trim() ? { slug: slugify(value) } : {})
              }))
            }
            placeholder={label}
            placeholderTextColor={theme.muted}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
            multiline={key === "description"}
          />
        ))}

        <View style={styles.categories}>
          {categoryOptions.map((category) => (
            <Pressable
              key={category}
              onPress={() => setForm((current) => ({ ...current, category }))}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: form.category === category ? theme.primary : theme.canvas
                }
              ]}
            >
              <Text style={{ color: form.category === category ? "#FFFFFF" : theme.text }}>{category}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: theme.muted }}>
          Choose an existing category above or type a new one directly into the category field.
        </Text>

        <View style={styles.categories}>
          {suppliers.map((supplier: any) => (
            <Pressable
              key={supplier._id}
              onPress={() => setForm((current) => ({ ...current, supplierId: supplier._id }))}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: form.supplierId === supplier._id ? theme.primary : theme.canvas
                }
              ]}
            >
              <Text style={{ color: form.supplierId === supplier._id ? "#FFFFFF" : theme.text }}>{supplier.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: theme.muted }}>
          {suppliers.length
            ? form.supplierId
              ? `Assigned supplier selected.`
              : "Select a supplier for automatic dispatch, or leave blank for manual fallback."
            : "No suppliers yet. Add suppliers from the admin dashboard first."}
        </Text>

        <Pressable onPress={pickProductImage} style={[styles.secondaryButton, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>{form.imageUrl ? "Replace image" : "Upload image"}</Text>
        </Pressable>
        {previewImageUrl || form.imageUrl ? <Image source={{ uri: previewImageUrl || form.imageUrl }} style={styles.previewImage} /> : null}

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => {
              setForm(emptyForm);
              setErrorMessage("");
              setStatusMessage("Ready for a new product.");
            }}
            style={[styles.secondaryAction, { borderColor: theme.border, backgroundColor: theme.canvas }]}
          >
            <Text style={{ color: theme.text, fontWeight: "700" }}>New product</Text>
          </Pressable>
          <Pressable
            onPress={() => saveMutation.mutate()}
            style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: saveMutation.isPending ? 0.7 : 1 }]}
          >
            <Text style={styles.primaryButtonText}>{saveMutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create product"}</Text>
          </Pressable>
        </View>
        {form.slug ? <Text style={{ color: theme.muted }}>Slug preview: {slugify(form.slug)}</Text> : null}
        {form.imageUrl ? <Text style={{ color: theme.muted }}>Image attached and ready to save.</Text> : null}
      </View>

      <View style={styles.libraryHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Existing products</Text>
        <Text style={{ color: theme.muted }}>{products.length} loaded</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.productRow}>
          {products.map((product: any) => (
            <Pressable
              key={product._id}
              onPress={() => handleSelectProduct(product)}
              style={[
                styles.productChip,
                {
                  backgroundColor: form._id === product._id ? theme.spotlight : theme.card,
                  borderColor: form._id === product._id ? theme.primary : theme.border
                }
              ]}
            >
              <Text style={{ color: theme.text, fontWeight: "700" }}>{product.name}</Text>
              <Text style={{ color: theme.muted }}>{product.category}</Text>
              <Text style={{ color: theme.muted }}>
                Supplier: {suppliers.find((supplier: any) => supplier._id === product.supplierId)?.name || "Manual fallback"}
              </Text>
              <Text style={{ color: theme.primary }}>{product.pricing?.baseCurrency} {product.pricing?.saleAmount || product.pricing?.amount}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  feedbackText: {
    fontSize: 14,
    fontWeight: "600"
  },
  errorText: {
    color: "#B3261E"
  },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999 },
  secondaryButton: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  actionRow: {
    flexDirection: "row",
    gap: 10
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center"
  },
  primaryButton: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  previewImage: { width: "100%", height: 220, borderRadius: 18 },
  libraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  productRow: { flexDirection: "row", gap: 12 },
  productChip: { borderWidth: 1, borderRadius: 18, padding: 14, minWidth: 220, gap: 4 }
});
