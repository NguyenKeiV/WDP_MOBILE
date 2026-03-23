/** Hình thức hỗ trợ — có thể khớp ENUM backend sau này */
export const VOLUNTEER_SUPPORT_TYPES = [
  { value: "relief_distribution", label: "Phát nhu yếu phẩm", icon: "inventory-2" },
  { value: "transport", label: "Vận chuyển / logistics", icon: "local-shipping" },
  { value: "evacuation_support", label: "Hỗ trợ sơ tán", icon: "transfer-within-a-station" },
  { value: "medical_basic", label: "Sơ cứu / y tế cơ bản", icon: "medical-services" },
  { value: "communication", label: "Thông tin / liên lạc", icon: "campaign" },
  { value: "other", label: "Khác", icon: "more-horiz" },
];

export const VOLUNTEER_STATUS = {
  pending: {
    label: "Chờ duyệt",
    color: "#F57F17",
    bg: "#FFF8E1",
  },
  approved: {
    label: "Đã duyệt",
    color: "#1565C0",
    bg: "#E3F2FD",
  },
  active: {
    label: "Đang tham gia",
    color: "#2E7D32",
    bg: "#E8F5E9",
  },
  completed: {
    label: "Đã kết thúc",
    color: "#546E7A",
    bg: "#ECEFF1",
  },
  rejected: {
    label: "Từ chối",
    color: "#C62828",
    bg: "#FFEBEE",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#757575",
    bg: "#F5F5F5",
  },
};
