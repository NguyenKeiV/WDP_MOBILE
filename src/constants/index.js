export const COLORS = {
  primary: "#E53935",
  primaryLight: "#FFEBEE",
  secondary: "#1565C0",
  success: "#2E7D32",
  warning: "#F57F17",
  danger: "#B71C1C",
  gray: "#757575",
  grayLight: "#F5F5F5",
  grayBorder: "#E0E0E0",
  white: "#FFFFFF",
  black: "#212121",
  text: "#333333",
  textLight: "#757575",
};

export const CATEGORIES = [
  { value: "rescue", label: "🆘 Cứu hộ", color: "#E53935" },
  { value: "relief", label: "📦 Cứu trợ", color: "#F57F17" },
];

export const STATUS_CONFIG = {
  new: { label: "Mới tạo", color: "#1565C0", bg: "#E3F2FD", icon: "🆕" },
  pending_verification: {
    label: "Đang xét duyệt",
    color: "#F57F17",
    bg: "#FFF8E1",
    icon: "⏳",
  },
  verified: {
    label: "Đã xác minh",
    color: "#7B1FA2",
    bg: "#F3E5F5",
    icon: "✅",
  },
  on_mission: {
    label: "Đang cứu hộ",
    color: "#E53935",
    bg: "#FFEBEE",
    icon: "🚨",
  },
  completed: {
    label: "Hoàn thành",
    color: "#2E7D32",
    bg: "#E8F5E9",
    icon: "✔️",
  },
  rejected: { label: "Từ chối", color: "#757575", bg: "#F5F5F5", icon: "❌" },
};

export const PRIORITIES = [
  { value: "urgent", label: "🔴 Khẩn cấp", color: "#B71C1C" },
  { value: "high", label: "🟠 Cao", color: "#E53935" },
  { value: "medium", label: "🟡 Trung bình", color: "#F57F17" },
  { value: "low", label: "🟢 Thấp", color: "#2E7D32" },
];

export const DISTRICTS = [
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Quận Bình Thạnh",
  "Quận Bình Tân",
  "Quận Gò Vấp",
  "Quận Phú Nhuận",
  "Quận Tân Bình",
  "Quận Tân Phú",
  "Quận Thủ Đức",
  "Huyện Bình Chánh",
  "Huyện Cần Giờ",
  "Huyện Củ Chi",
  "Huyện Hóc Môn",
  "Huyện Nhà Bè",
];
