import apiClient from "./client";

export const charityCampaignApi = {
  getActive: () => apiClient.get("/charity-campaigns/active"),
};
