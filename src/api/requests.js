import apiClient from "./client";

export const requestsApi = {
  // Lấy tất cả yêu cầu (feed công khai)
  getAll: (params = {}) => apiClient.get("/rescue-requests", { params }),

  // Lấy yêu cầu của user hiện tại
  getMyRequests: (userId, params = {}) =>
    apiClient.get("/rescue-requests", {
      params: { ...params, user_id: userId },
    }),

  // Lấy chi tiết 1 yêu cầu
  getById: (id) => apiClient.get(`/rescue-requests/${id}`),

  // Tạo yêu cầu mới
  create: (data) => apiClient.post("/rescue-requests", data),

  // Thống kê
  getStats: () => apiClient.get("/rescue-requests/stats/summary"),

  // Gắn yêu cầu guest vào tài khoản vừa đăng nhập (sau khi login)
  linkToMe: (requestIds) =>
    apiClient.post("/rescue-requests/link-to-me", {
      request_ids: Array.isArray(requestIds) ? requestIds : [],
    }),

  // Người dân xác nhận đã được cứu hộ / phản hồi kết quả
  citizenConfirmRescue: (id, confirmed, feedback_notes = "") =>
    apiClient.post(`/rescue-requests/${id}/citizen-confirm-rescue`, {
      confirmed,
      feedback_notes,
    }),
};
