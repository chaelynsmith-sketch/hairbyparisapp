import { api } from "@/services/api";
import { UploadedMedia } from "@/types";

type UploadCategory = "product-media" | "review-media";
type NativeAsset = { uri: string; mimeType?: string | null; fileName?: string | null };
type WebAsset = File;

export async function uploadMedia(
  endpoint: UploadCategory,
  asset: NativeAsset | WebAsset
): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("category", endpoint === "product-media" ? "products" : "reviews");

  if (typeof File !== "undefined" && asset instanceof File) {
    formData.append("file", asset);
  } else {
    const nativeAsset = asset as NativeAsset;
    formData.append("file", {
      uri: nativeAsset.uri,
      type: nativeAsset.mimeType || "image/jpeg",
      name: nativeAsset.fileName || `${endpoint}-${Date.now()}.jpg`
    } as any);
  }

  const { data } = await api.post(`/uploads/${endpoint}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data.media;
}
