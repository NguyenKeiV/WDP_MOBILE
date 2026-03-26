import apiClient from "./client";

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      supply_id: item?.supply_id || null,
      supply_name: item?.supply_name || "Vật phẩm",
      unit: item?.unit || "",
      quantity: Number(item?.quantity || 0),
    }))
    .filter((item) => item.quantity > 0 || item.supply_name);
}

function normalizeHistoryItem(raw) {
  return {
    receipt_code: raw?.receipt_code || "",
    import_batch_id: raw?.import_batch_id || null,
    import_date: raw?.import_date || null,
    donor_name: raw?.donor_name || "",
    donor_phone: raw?.donor_phone || "",
    manager: {
      id: raw?.manager?.id || null,
      username: raw?.manager?.username || "",
    },
    items: normalizeItems(raw?.items),
  };
}

export const charityHistoryApi = {
  getByPhone: async (donorPhone, params = {}) => {
    const res = await apiClient.get("/charity/history", {
      params: {
        donor_phone: donorPhone,
        page: params.page || 1,
        limit: params.limit || 20,
      },
    });

    const data = Array.isArray(res?.data) ? res.data : [];

    return {
      ...res,
      data: data.map(normalizeHistoryItem),
      pagination: res?.pagination || {
        page: 1,
        limit: 20,
        total: data.length,
        totalPages: 1,
      },
    };
  },
};
