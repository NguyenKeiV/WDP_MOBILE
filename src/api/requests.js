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
};
