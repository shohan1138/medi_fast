import apiClient from "./client";

export const getCurrentUser = () => apiClient.get("/auth/me");

export const changePassword = (old_password, new_password) =>
  apiClient.patch("/auth/change-password", { old_password, new_password });

export const listUsers = () => apiClient.get("/auth/users");
export const listRoles = () => apiClient.get("/auth/roles");

export const toggleUserStatus = (userId) =>
  apiClient.patch(`/auth/users/${userId}/status`);

export const assignRole = (userId, roleName) =>
  apiClient.post(`/auth/users/${userId}/roles/${roleName}`);

export const removeRole = (userId, roleName) =>
  apiClient.delete(`/auth/users/${userId}/roles/${roleName}`);
