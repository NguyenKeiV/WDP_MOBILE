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
    formData.append("image", {
      uri,
      type: "image/jpeg",
      name: "photo.jpg",
    });
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    return data?.url || data?.data?.url || null;
  } catch {
    return null;
  }
}
