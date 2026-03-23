import apiClient from "./client";

/**
 * Đăng ký tình nguyện — nối API backend.
 * Base path: /volunteer-registrations
 */
export async function fetchMyVolunteerRegistrations(_userId) {
  const res = await apiClient.get("/volunteer-registrations/me");
  return { data: res.data ?? [] };
}

export async function fetchVolunteerRegistrationById(_userId, id) {
  const res = await apiClient.get(`/volunteer-registrations/${id}`);
  return { data: res.data };
}

export async function createVolunteerRegistration(_userId, body) {
  const { support_type, district, note } = body;
  const res = await apiClient.post("/volunteer-registrations", {
    support_type,
    district,
    note: note ?? null,
  });
  return { data: res.data };
}
