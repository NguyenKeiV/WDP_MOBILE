import apiClient from "./client";

export const missionsApi = {
  getMyTeamMissions: () => apiClient.get("/rescue-requests/my-team-missions"),

  complete: (id, completion_notes = "", completion_media_urls = []) =>
    apiClient.post(`/rescue-requests/${id}/complete`, {
      completion_notes,
      completion_media_urls: Array.isArray(completion_media_urls)
        ? completion_media_urls
        : [],
    }),

  reportIncomplete: (id, { reason, failure_media_urls = [] }) =>
    apiClient.post(`/rescue-requests/${id}/report-mission-incomplete`, {
      reason: String(reason || "").trim(),
      failure_media_urls: Array.isArray(failure_media_urls)
        ? failure_media_urls
        : [],
    }),
};
