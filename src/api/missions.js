import apiClient from "./client";

/**
 * Báo cáo không hoàn thành (mobile-only flow): dùng PUT có sẵn trên BE.
 * Lý do + URL ảnh gộp vào notes; status về pending_verification để điều phối xử lý lại.
 */
export const missionsApi = {
  getMyTeamMissions: () => apiClient.get("/rescue-requests/my-team-missions"),

  complete: (id, completion_notes = "", completion_media_urls = []) =>
    apiClient.post(`/rescue-requests/${id}/complete`, {
      completion_notes,
      completion_media_urls: Array.isArray(completion_media_urls)
        ? completion_media_urls
        : [],
    }),

  reportIncomplete: (id, { reason, previousNotes = "", imageUrls = [] }) => {
    const ts = new Date().toISOString();
    const lines = [
      previousNotes && String(previousNotes).trim(),
      `--- Báo cáo không hoàn thành (${ts}) ---`,
      String(reason || "").trim(),
      Array.isArray(imageUrls) && imageUrls.length > 0
        ? `Ảnh minh chứng:\n${imageUrls.filter(Boolean).join("\n")}`
        : "",
    ].filter(Boolean);
    return apiClient.put(`/rescue-requests/${id}`, {
      status: "pending_verification",
      notes: lines.join("\n"),
    });
  },
};
