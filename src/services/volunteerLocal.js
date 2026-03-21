import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "volunteer_registrations_local_v1";

async function loadAll() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(items) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listForUser(userId) {
  if (!userId) return [];
  const all = await loadAll();
  return all
    .filter((r) => r.user_id === userId)
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
}

export async function getByIdForUser(userId, id) {
  const all = await loadAll();
  return all.find((r) => r.id === id && r.user_id === userId) || null;
}

export async function createForUser(userId, payload) {
  const all = await loadAll();
  const row = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    user_id: userId,
    status: "pending",
    coordinator_note: null,
    created_at: new Date().toISOString(),
    ...payload,
  };
  all.push(row);
  await saveAll(all);
  return row;
}
