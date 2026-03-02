import apiClient from "./client";

export const missionsApi = {
  getMyTeamMissions: () => apiClient.get("/rescue-requests/my-team-missions"),

  complete: (id, completion_notes = "") =>
    apiClient.post(`/rescue-requests/${id}/complete`, { completion_notes }),
};
