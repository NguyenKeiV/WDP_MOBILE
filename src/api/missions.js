import apiClient from "./client";

export const missionsApi = {
  getMyTeamMissions: () => apiClient.get("/rescue-requests/my-team-missions"),

  // THÊM MỚI
  acceptMission: (id) => apiClient.post(`/rescue-requests/${id}/team-accept`),

  // THÊM MỚI
  rejectMission: (id, reason) =>
    apiClient.post(`/rescue-requests/${id}/team-reject`, { reason }),

  complete: (id, completion_notes = "", completion_media_urls = []) =>
    apiClient.post(`/rescue-requests/${id}/complete`, {
      completion_notes,
      completion_media_urls: Array.isArray(completion_media_urls)
        ? completion_media_urls
        : [],
    }),
};
