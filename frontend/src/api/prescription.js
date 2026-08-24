import apiClient from "./client";

export const createPrescription = (payload) =>
  apiClient.post("/prescriptions/", payload);
export const listPrescriptions = () => apiClient.get("/prescriptions/");
export const getMyPrescriptions = () => apiClient.get("/prescriptions/me");
export const getPrescription = (prescriptionId) =>
  apiClient.get(`/prescriptions/${prescriptionId}`);
export const getPrescriptionByAppointment = (appointmentId) =>
  apiClient.get(`/prescriptions/appointment/${appointmentId}`);
export const updatePrescriptionStatus = (prescriptionId, status) =>
  apiClient.patch(`/prescriptions/${prescriptionId}/status`, { status });

export const addPrescriptionItem = (prescriptionId, payload) =>
  apiClient.post(`/prescriptions/${prescriptionId}/items`, payload);
export const updatePrescriptionItem = (prescriptionId, itemId, payload) =>
  apiClient.patch(`/prescriptions/${prescriptionId}/items/${itemId}`, payload);
export const deletePrescriptionItem = (prescriptionId, itemId) =>
  apiClient.delete(`/prescriptions/${prescriptionId}/items/${itemId}`);
