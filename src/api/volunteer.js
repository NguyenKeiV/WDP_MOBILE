import * as volunteerLocal from "../services/volunteerLocal";

/**
 * Lớp gọi dữ liệu tình nguyện — hiện dùng AsyncStorage (demo / prototype).
 * Khi backend sẵn sàng: thay nội dung bằng apiClient (GET/POST/PATCH) và giữ
 * cùng tên hàm + shape { data } để màn hình ít đổi nhất.
 */

export async function fetchMyVolunteerRegistrations(userId) {
  const data = await volunteerLocal.listForUser(userId);
  return { data };
}

export async function fetchVolunteerRegistrationById(userId, id) {
  const data = await volunteerLocal.getByIdForUser(userId, id);
  return { data };
}

export async function createVolunteerRegistration(userId, body) {
  const data = await volunteerLocal.createForUser(userId, body);
  return { data };
}
