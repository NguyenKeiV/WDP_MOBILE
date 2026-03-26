import apiClient from "./client";
import { vehicleRequestsApi } from "./vehicleRequests";

export const missionsApi = {
  getMyTeamMissions: () => apiClient.get("/rescue-requests/my-team-missions"),

  // Lấy yêu cầu phương tiện theo rescue request hiện tại của team
  getMyVehicleRequestByRescueRequest: async (rescueRequestId) => {
    const res = await vehicleRequestsApi.getAll({
      rescue_request_id: rescueRequestId,
      limit: 20,
      page: 1,
    });
    const list = Array.isArray(res?.data) ? res.data : [];
    // ưu tiên bản ghi mới nhất theo created_at
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
    return sorted.find((v) => String(v.rescue_request_id) === String(rescueRequestId)) || null;
  },

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

  reportExecution: (
    id,
    {
      executed,
      outcome,
      unmet_people_count,
      partial_reason,
      report_notes,
      report_media_urls,
    },
  ) =>
    apiClient.post(`/rescue-requests/${id}/team-report-execution`, {
      ...(executed !== undefined ? { executed } : {}),
      ...(outcome ? { outcome } : {}),
      ...(unmet_people_count !== undefined && unmet_people_count !== null
        ? { unmet_people_count }
        : {}),
      ...(partial_reason ? { partial_reason } : {}),
      report_notes,
      report_media_urls: Array.isArray(report_media_urls)
        ? report_media_urls
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
