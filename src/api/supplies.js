import apiClient from "./client";

export const suppliesApi = {
  getAllSupplies: (params = {}) => apiClient.get("/supplies", { params }),
  getMyTeamDistributions: (params = {}) =>
    apiClient.get("/supplies/my-team-distributions", { params }),
  getMyTeamInventory: () => apiClient.get("/supplies/usages/my-team-inventory"),
  getMyTeamUsages: (params = {}) =>
    apiClient.get("/supplies/usages/my-team", { params }),
};
