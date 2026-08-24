import apiClient from "./client";

export const getMyDoctorProfile = () => apiClient.get("/doctors/me");
export const createMyDoctorProfile = (payload) =>
  apiClient.post("/doctors/me", payload);
export const updateMyDoctorProfile = (payload) =>
  apiClient.patch("/doctors/me", payload);

export const listDoctors = () => apiClient.get("/doctors/");
export const getDoctor = (doctorId) => apiClient.get(`/doctors/${doctorId}`);
export const createDoctorForUser = (payload) =>
  apiClient.post("/doctors/", payload);
export const updateDoctor = (doctorId, payload) =>
  apiClient.patch(`/doctors/${doctorId}`, payload);
export const deleteDoctor = (doctorId) =>
  apiClient.delete(`/doctors/${doctorId}`);

export const getMySchedule = () => apiClient.get("/doctors/me/schedule");
export const addScheduleSlot = (payload) =>
  apiClient.post("/doctors/me/schedule", payload);
export const updateScheduleSlot = (scheduleId, payload) =>
  apiClient.patch(`/doctors/me/schedule/${scheduleId}`, payload);
export const deleteScheduleSlot = (scheduleId) =>
  apiClient.delete(`/doctors/me/schedule/${scheduleId}`);
export const getDoctorSchedule = (doctorId) =>
  apiClient.get(`/doctors/${doctorId}/schedule`);
