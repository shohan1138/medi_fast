import apiClient from "./client";

// Medical Records
export const createMedicalRecord = (payload) =>
  apiClient.post("/medical-records/", payload);
export const getMedicalRecordByAppointment = (appointmentId) =>
  apiClient.get(`/medical-records/appointment/${appointmentId}`);
export const updateMedicalRecord = (recordId, payload) =>
  apiClient.patch(`/medical-records/${recordId}`, payload);
export const deleteMedicalRecord = (recordId) =>
  apiClient.delete(`/medical-records/${recordId}`);

// Lab Reports
export const createLabReport = (payload) =>
  apiClient.post("/lab-reports/", payload);
export const getLabReportsByAppointment = (appointmentId) =>
  apiClient.get(`/lab-reports/appointment/${appointmentId}`);
export const updateLabReport = (reportId, payload) =>
  apiClient.patch(`/lab-reports/${reportId}`, payload);
export const deleteLabReport = (reportId) =>
  apiClient.delete(`/lab-reports/${reportId}`);
