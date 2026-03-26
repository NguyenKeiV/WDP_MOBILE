import apiClient from "./client";

function normalizePosterUrls(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === "string" && item.trim());
  }

  if (typeof raw === "string" && raw.trim()) {
    return [raw];
  }

  return [];
}

export function normalizeCampaignDetail(raw) {
  if (!raw || typeof raw !== "object") return null;

  const posters = normalizePosterUrls(
    raw.poster_urls ?? raw.image_urls ?? raw.image_url,
  );

  return {
    id: raw.id,
    name: raw.name || raw.title || "",
    address: raw.address || "",
    start_at: raw.start_at || raw.start_date || null,
    end_at: raw.end_at || raw.end_date || null,
    reason: raw.reason || raw.description || "",
    poster_urls: posters,
    status: raw.status || "inactive",
    manager: {
      id: raw.manager?.id || raw.creator?.id || null,
      username: raw.manager?.username || raw.creator?.username || "",
    },
  };
}

export const charityCampaignApi = {
  getActive: () => apiClient.get("/charity-campaigns/active"),
  getById: async (id) => {
    const res = await apiClient.get(`/charity/campaigns/${id}`);
    return {
      ...res,
      data: normalizeCampaignDetail(res?.data),
    };
  },
};
