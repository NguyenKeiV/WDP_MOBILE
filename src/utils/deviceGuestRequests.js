import AsyncStorage from "@react-native-async-storage/async-storage";

/** Id yêu cầu tạo lúc chưa đăng nhập (theo máy). */
export const GUEST_REQUEST_IDS_KEY = "guest_request_ids";

const MAX_DEVICE_LINKED = 80;

function deviceLinkedKey(userId) {
  return `device_linked_guest_request_ids_${userId}`;
}

export async function getDeviceLinkedRequestIds(userId) {
  if (!userId) return [];
  const raw = await AsyncStorage.getItem(deviceLinkedKey(userId));
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Chuyển danh sách guest trên máy sang "theo user nhưng chỉ trên thiết bị này"
 * (không gọi API link-to-me — không gắn user_id trên server).
 * Trả về số id vừa chuyển từ guest.
 */
export async function promoteGuestRequestIdsToDeviceUser(userId) {
  if (!userId) return 0;
  const raw = await AsyncStorage.getItem(GUEST_REQUEST_IDS_KEY);
  if (!raw) return 0;
  let guestIds = [];
  try {
    guestIds = JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(GUEST_REQUEST_IDS_KEY);
    return 0;
  }
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    await AsyncStorage.removeItem(GUEST_REQUEST_IDS_KEY);
    return 0;
  }
  const key = deviceLinkedKey(userId);
  let existing = [];
  const existingRaw = await AsyncStorage.getItem(key);
  if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw);
      if (Array.isArray(parsed)) existing = parsed.filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  const merged = [...new Set([...existing, ...guestIds])];
  await AsyncStorage.setItem(
    key,
    JSON.stringify(merged.slice(0, MAX_DEVICE_LINKED)),
  );
  await AsyncStorage.removeItem(GUEST_REQUEST_IDS_KEY);
  return guestIds.length;
}
