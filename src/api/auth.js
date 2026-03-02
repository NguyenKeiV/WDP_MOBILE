import apiClient from "./client";

export const authApi = {
  login: (email, password) =>
    apiClient.post("/users/login", { email, password }),

  register: (username, email, password) =>
    apiClient.post("/users/register", {
      username,
      email,
      password,
      role: "user",
    }),

  getProfile: () => apiClient.get("/users/profile"),
};
