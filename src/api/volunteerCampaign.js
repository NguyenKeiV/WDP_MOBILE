import apiClient from "./client";

export const volunteerCampaignApi = {
  getMyInvitations: (params = {}) =>
    apiClient.get("/volunteer-campaigns/invitations/me", {
      params: { page: 1, limit: 100, ...params },
    }),

  respondToInvitation: (id, { accept, declined_reason } = {}) =>
    apiClient.patch(`/volunteer-campaigns/invitations/${id}/respond`, {
      accept,
      declined_reason: declined_reason ?? null,
    }),
};
