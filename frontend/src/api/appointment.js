import apiClient from "./client";

export const bookAppointment = (payload) =>
  apiClient.post("/appointments/", payload);
export const getMyAppointments = () => apiClient.get("/appointments/me");
export const listAppointments = () => apiClient.get("/appointments/");
export const getAppointment = (id) => apiClient.get(`/appointments/${id}`);
export const updateAppointmentStatus = (id, status) =>
  apiClient.patch(`/appointments/${id}/status`, null, { params: { status } });
export const rescheduleAppointment = (id, payload) =>
  apiClient.patch(`/appointments/${id}`, payload);
export const cancelAppointment = (id) =>
  apiClient.delete(`/appointments/${id}`);
