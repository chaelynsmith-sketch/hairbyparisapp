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
type ProductMedia = { url: string; type: string; alt?: string };
type ProductVariantForm = {
  _id?: string;
  label: string;
  sku: string;
  price: string;
  salePrice: string;
  quantity: string;
  supplierCost: string;
  media: ProductMedia[];
  previewMedia: ProductMedia[];
};

const emptyForm = {
  _id: "",
  name: "",
  slug: "",
  category: "Hair Products",
  tags: "",
  description: "",
  amount: "",
  saleAmount: "",
  sku: "",
  quantity: "",
  media: [] as ProductMedia[],
  variants: [] as ProductVariantForm[],
  supplierId: "",
  supplierPlatform: "",
  supplierSourceUrl: "",
  supplierReference: "",
  supplierNotes: ""
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
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string }[]>([]);
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
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        description: form.description,
        media: form.media.map((item) => ({
          type: item.type,
          url: item.url,
          alt: item.alt || form.name
        })),
        variants: form.variants
          .filter((variant) => variant.label.trim())
          .map((variant) => ({
            ...(variant._id ? { _id: variant._id } : {}),
            label: variant.label.trim(),
            sku: variant.sku.trim() || undefined,
            price: variant.price ? Number(variant.price) : undefined,
            salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
            quantity: Number(variant.quantity || 0),
            supplierCost: Number(variant.supplierCost || 0),
            media: variant.media.map((item) => ({
              type: item.type,
              url: item.url,
              alt: item.alt || `${form.name} ${variant.label}`.trim()
            }))
          })),
        pricing: {
          baseCurrency: "ZAR",
          amount: Number(form.amount || 0),
          saleAmount: form.saleAmount ? Number(form.saleAmount) : undefined
        },
        supplierId: form.supplierId || undefined,
        sourcing: {
          platform: form.supplierPlatform.trim() || undefined,
          sourceUrl: form.supplierSourceUrl.trim() || undefined,
          supplierReference: form.supplierReference.trim() || undefined,
          notes: form.supplierNotes.trim() || undefined
        },
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
      setPreviewMedia([]);
      setStatusMessage(`${product.name} saved successfully.`);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to save product.");
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage("");
      setStatusMessage("");

      if (!form._id) {
        throw new Error("Select a product before removing it.");
      }

      return updateProduct(form._id, { status: "archived" });
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setForm(emptyForm);
      setPreviewMedia([]);
      setErrorMessage("");
      setStatusMessage(`${product.name} removed from the storefront.`);
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to remove product.");
    }
  });

  async function pickProductMedia() {
    setErrorMessage("");
    setStatusMessage("");

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*";
      input.multiple = true;

      input.onchange = async () => {
        const files = Array.from(input.files || []);

        if (!files.length) {
          return;
        }

        setStatusMessage(`Uploading ${files.length} media item${files.length > 1 ? "s" : ""}...`);

        try {
          const uploaded = await Promise.all(files.map((file) => uploadMedia("product-media", file)));
          setPreviewMedia((current) => [
            ...current,
            ...files.map((file, index) => ({
              url: URL.createObjectURL(file),
              type: uploaded[index].type
            }))
          ]);
          setForm((current) => ({
            ...current,
            media: [
              ...current.media,
              ...uploaded.map((item) => ({
                url: item.url,
                type: item.type,
                alt: current.name || "Product media"
              }))
            ]
          }));
          setStatusMessage(`${uploaded.length} media item${uploaded.length > 1 ? "s" : ""} uploaded.`);
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload media.");
        }
      };

      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.9
    });

    if (result.canceled) {
      return;
    }

    try {
      const uploaded = await Promise.all(result.assets.map((asset) => uploadMedia("product-media", asset)));
      setPreviewMedia((current) => [
        ...current,
        ...result.assets.map((asset, index) => ({
          url: asset.uri,
          type: uploaded[index].type
        }))
      ]);
      setForm((current) => ({
        ...current,
        media: [
          ...current.media,
          ...uploaded.map((item) => ({
            url: item.url,
            type: item.type,
            alt: current.name || "Product media"
          }))
        ]
      }));
      setStatusMessage(`${uploaded.length} media item${uploaded.length > 1 ? "s" : ""} uploaded.`);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload media.");
    }
  }

  function updateVariant(index: number, patch: Partial<ProductVariantForm>) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, ...patch } : variant
      )
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          label: "",
          sku: "",
          price: current.amount,
          salePrice: "",
          quantity: "0",
          supplierCost: "",
          media: [],
          previewMedia: []
        }
      ]
    }));
  }

  async function pickVariantMedia(index: number) {
    setErrorMessage("");
    setStatusMessage("");

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*";
      input.multiple = true;

      input.onchange = async () => {
        const files = Array.from(input.files || []);

        if (!files.length) {
          return;
        }

        setStatusMessage(`Uploading ${files.length} variant media item${files.length > 1 ? "s" : ""}...`);

        try {
          const uploaded = await Promise.all(files.map((file) => uploadMedia("product-media", file)));
          setForm((current) => ({
            ...current,
            variants: current.variants.map((variant, currentIndex) =>
              currentIndex === index
                ? {
                    ...variant,
                    previewMedia: [
                      ...variant.previewMedia,
                      ...files.map((file, fileIndex) => ({
                        url: URL.createObjectURL(file),
                        type: uploaded[fileIndex].type
                      }))
                    ],
                    media: [
                      ...variant.media,
                      ...uploaded.map((item) => ({
                        url: item.url,
                        type: item.type,
                        alt: `${current.name} ${variant.label}`.trim() || "Variant media"
                      }))
                    ]
                  }
                : variant
            )
          }));
          setStatusMessage(`${uploaded.length} variant media item${uploaded.length > 1 ? "s" : ""} uploaded.`);
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload variant media.");
        }
      };

      input.click();
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.9
    });

    if (result.canceled) {
      return;
    }

    try {
      const uploaded = await Promise.all(result.assets.map((asset) => uploadMedia("product-media", asset)));
      setForm((current) => ({
        ...current,
        variants: current.variants.map((variant, currentIndex) =>
          currentIndex === index
            ? {
                ...variant,
                previewMedia: [
                  ...variant.previewMedia,
                  ...result.assets.map((asset, assetIndex) => ({
                    url: asset.uri,
                    type: uploaded[assetIndex].type
                  }))
                ],
                media: [
                  ...variant.media,
                  ...uploaded.map((item) => ({
                    url: item.url,
                    type: item.type,
                    alt: `${current.name} ${variant.label}`.trim() || "Variant media"
                  }))
                ]
              }
            : variant
        )
      }));
      setStatusMessage(`${uploaded.length} variant media item${uploaded.length > 1 ? "s" : ""} uploaded.`);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.message || "Unable to upload variant media.");
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
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      description: product.description,
      amount: String(product.pricing?.amount || ""),
      saleAmount: product.pricing?.saleAmount ? String(product.pricing.saleAmount) : "",
      sku: product.inventory?.sku || "",
      quantity: String(product.inventory?.quantity || ""),
      media: Array.isArray(product.media)
        ? product.media.map((item: any) => ({
            url: item.url,
            type: item.type,
            alt: item.alt
          }))
        : [],
      variants: Array.isArray(product.variants)
        ? product.variants.map((variant: any) => ({
            _id: variant._id,
            label: variant.label || "",
            sku: variant.sku || "",
            price: variant.price ? String(variant.price) : "",
            salePrice: variant.salePrice ? String(variant.salePrice) : "",
            quantity: String(variant.quantity || 0),
            supplierCost: variant.supplierCost ? String(variant.supplierCost) : "",
            media: Array.isArray(variant.media)
              ? variant.media.map((item: any) => ({
                  url: item.url,
                  type: item.type || "image",
                  alt: item.alt
                }))
              : [],
            previewMedia: Array.isArray(variant.media)
              ? variant.media.map((item: any) => ({
                  url: item.url,
                  type: item.type || "image",
                  alt: item.alt
                }))
              : []
          }))
        : [],
      supplierId: product.supplierId || "",
      supplierPlatform: product.sourcing?.platform || "",
      supplierSourceUrl: product.sourcing?.sourceUrl || "",
      supplierReference: product.sourcing?.supplierReference || "",
      supplierNotes: product.sourcing?.notes || ""
    });
    setPreviewMedia(
      Array.isArray(product.media)
        ? product.media.map((item: any) => ({
            url: item.url,
            type: item.type || "image"
          }))
        : []
    );
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
            setPreviewMedia([]);
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
          ["tags", "Tags (comma separated)"],
          ["description", "Description"],
          ["amount", "Price"],
          ["saleAmount", "Sale price"],
          ["sku", "SKU"],
          ["quantity", "Stock quantity"],
          ["supplierPlatform", "Supplier platform"],
          ["supplierSourceUrl", "Supplier product link"],
          ["supplierReference", "Supplier reference / SKU"],
          ["supplierNotes", "Supplier notes"]
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
        <Text style={{ color: theme.muted }}>
          Use tags for extra grouping like Best Seller, New In, Bundles, Sale, or Human Hair.
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

        <Pressable onPress={pickProductMedia} style={[styles.secondaryButton, { borderColor: theme.border }]}>
          <Text style={{ color: theme.text }}>
            {form.media.length ? "Add more images or videos" : "Upload images or videos"}
          </Text>
        </Pressable>
        {previewMedia.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.previewRow}>
              {previewMedia.map((item, index) => (
                <View key={`${item.url}-${index}`} style={styles.previewTile}>
                  {item.type === "video" ? (
                    Platform.OS === "web" ? (
                      <video src={item.url} style={styles.previewVideo as any} controls playsInline />
                    ) : (
                      <View style={[styles.videoFallback, { backgroundColor: theme.canvas, borderColor: theme.border }]}>
                        <Text style={{ color: theme.text, fontWeight: "700" }}>Video uploaded</Text>
                        <Text style={{ color: theme.muted }}>Visible on web gallery</Text>
                      </View>
                    )
                  ) : (
                    <Image source={{ uri: item.url }} style={styles.previewImage} />
                  )}
                  <Pressable
                    onPress={() => {
                      setPreviewMedia((current) => current.filter((_, currentIndex) => currentIndex !== index));
                      setForm((current) => ({
                        ...current,
                        media: current.media.filter((_, currentIndex) => currentIndex !== index)
                      }));
                    }}
                    style={[styles.removeMediaButton, { borderColor: theme.border, backgroundColor: theme.card }]}
                  >
                    <Text style={{ color: theme.text, fontWeight: "700" }}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <View style={[styles.variantCard, { backgroundColor: theme.canvas, borderColor: theme.border }]}>
          <View style={styles.libraryHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sizes / lengths</Text>
              <Text style={{ color: theme.muted }}>Add adjacent customer options with their own price, stock, and media.</Text>
            </View>
            <Pressable onPress={addVariant} style={[styles.smallButton, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text, fontWeight: "800" }}>Add option</Text>
            </Pressable>
          </View>
          {form.variants.map((variant, index) => (
            <View key={variant._id || `variant-${index}`} style={[styles.variantEditor, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: "800" }}>Option {index + 1}</Text>
              {[
                ["label", "Length / size label, e.g. 12 inch"],
                ["sku", "Variant SKU"],
                ["price", "Variant price"],
                ["salePrice", "Variant sale price"],
                ["quantity", "Variant stock quantity"],
                ["supplierCost", "Supplier cost for this option"]
              ].map(([key, label]) => (
                <TextInput
                  key={key}
                  value={(variant as any)[key]}
                  onChangeText={(value) => updateVariant(index, { [key]: value } as Partial<ProductVariantForm>)}
                  placeholder={label}
                  placeholderTextColor={theme.muted}
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.canvas }]}
                />
              ))}
              <Pressable onPress={() => pickVariantMedia(index)} style={[styles.secondaryButton, { borderColor: theme.border }]}>
                <Text style={{ color: theme.text }}>
                  {variant.media.length ? "Add more media for this option" : "Upload option images or videos"}
                </Text>
              </Pressable>
              {variant.previewMedia.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.previewRow}>
                    {variant.previewMedia.map((item, mediaIndex) => (
                      <View key={`${item.url}-${mediaIndex}`} style={styles.previewTile}>
                        {item.type === "video" ? (
                          Platform.OS === "web" ? (
                            <video src={item.url} style={styles.previewVideo as any} controls playsInline />
                          ) : (
                            <View style={[styles.videoFallback, { backgroundColor: theme.canvas, borderColor: theme.border }]}>
                              <Text style={{ color: theme.text, fontWeight: "700" }}>Video uploaded</Text>
                              <Text style={{ color: theme.muted }}>Visible on web gallery</Text>
                            </View>
                          )
                        ) : (
                          <Image source={{ uri: item.url }} style={styles.previewImage} />
                        )}
                        <Pressable
                          onPress={() => {
                            setForm((current) => ({
                              ...current,
                              variants: current.variants.map((currentVariant, currentIndex) =>
                                currentIndex === index
                                  ? {
                                      ...currentVariant,
                                      media: currentVariant.media.filter((_, currentMediaIndex) => currentMediaIndex !== mediaIndex),
                                      previewMedia: currentVariant.previewMedia.filter((_, currentMediaIndex) => currentMediaIndex !== mediaIndex)
                                    }
                                  : currentVariant
                              )
                            }));
                          }}
                          style={[styles.removeMediaButton, { borderColor: theme.border, backgroundColor: theme.card }]}
                        >
                          <Text style={{ color: theme.text, fontWeight: "700" }}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : null}
              <Pressable
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    variants: current.variants.filter((_, currentIndex) => currentIndex !== index)
                  }))
                }
                style={[styles.removeMediaButton, { borderColor: "#B3261E", backgroundColor: theme.card }]}
              >
                <Text style={styles.removeButtonText}>Remove option</Text>
              </Pressable>
            </View>
          ))}
        </View>

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
        {form.media.length ? (
          <Text style={{ color: theme.muted }}>
            {form.media.length} media item{form.media.length > 1 ? "s" : ""} attached and ready to save.
          </Text>
        ) : null}
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
              <Text style={{ color: theme.muted }}>
                Source: {product.sourcing?.platform || "Not linked"}
              </Text>
              <Text style={{ color: theme.muted }}>
                Tags: {product.tags?.length ? product.tags.join(", ") : "No tags"}
              </Text>
              <Text style={{ color: theme.muted }}>
                Status: {product.status || "active"}
              </Text>
              <Text style={{ color: theme.primary }}>{product.pricing?.baseCurrency} {product.pricing?.saleAmount || product.pricing?.amount}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {isEditing ? (
        <Pressable
          onPress={() => archiveMutation.mutate()}
          style={[
            styles.removeButton,
            {
              borderColor: "#B3261E",
              backgroundColor: theme.card,
              opacity: archiveMutation.isPending ? 0.7 : 1
            }
          ]}
        >
          <Text style={styles.removeButtonText}>
            {archiveMutation.isPending ? "Removing..." : "Remove from storefront"}
          </Text>
        </Pressable>
      ) : null}
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
  smallButton: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  variantCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 12 },
  variantEditor: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
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
  previewRow: {
    flexDirection: "row",
    gap: 12
  },
  previewTile: {
    width: 220,
    gap: 8
  },
  previewImage: { width: 220, height: 220, borderRadius: 18 },
  previewVideo: { width: 220, height: 220, borderRadius: 18, objectFit: "cover" },
  videoFallback: {
    width: 220,
    height: 220,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16
  },
  libraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  productRow: { flexDirection: "row", gap: 12 },
  productChip: { borderWidth: 1, borderRadius: 18, padding: 14, minWidth: 220, gap: 4 },
  removeButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center"
  },
  removeButtonText: {
    color: "#B3261E",
    fontWeight: "700"
  },
  removeMediaButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center"
  }
});
