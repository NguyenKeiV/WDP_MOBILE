import apiClient from "./client";

export const suppliesApi = {
  getMyTeamDistributions: (params = {}) =>
    apiClient.get("/supplies/my-team-distributions", { params }),
};
