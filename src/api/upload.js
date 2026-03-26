import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://wdp-be-x41z.onrender.com/api";

/**
 * Upload một ảnh lên server, trả về URL công khai.
 * Khi backend có endpoint POST /upload (multipart), sẽ trả về { url }.
 * Nếu chưa có API upload thì trả về null (app vẫn gửi media_urls: []).
 */
export async function uploadImage(uri) {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    const formData = new FormData();

    const fileNameFromUri = uri?.split("/").pop() || `photo_${Date.now()}.jpg`;
    const ext = (fileNameFromUri.split(".").pop() || "jpg").toLowerCase();
    const mimeByExt = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      heic: "image/heic",
      heif: "image/heif",
    };
    const mimeType = mimeByExt[ext] || "image/jpeg";

    formData.append("image", {
      uri,
      type: mimeType,
      name: fileNameFromUri,
    });

    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const raw = await res.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw || "Upload failed" };
    }

    if (!res.ok) {
      const message =
        data?.error ||
        data?.message ||
        (res.status === 413
          ? "Ảnh quá lớn (tối đa 5MB mỗi ảnh)"
          : `Upload failed (${res.status})`);
      throw new Error(message);
    }

    const url = data?.url || data?.data?.url || null;
    if (!url) throw new Error("Upload thành công nhưng không nhận được URL ảnh");

    return url;
  } catch (error) {
    throw error;
  }
}
