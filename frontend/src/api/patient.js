import apiClient from "./client";

export const getMyPatientProfile = () => apiClient.get("/patients/me");
export const createMyPatientProfile = (payload) =>
  apiClient.post("/patients/me", payload);
export const updateMyPatientProfile = (payload) =>
  apiClient.patch("/patients/me", payload);
export const updatePatient = (patientId, payload) =>
  apiClient.patch(`/patients/${patientId}`, payload);
export const listPatients = () => apiClient.get("/patients/");
export const getPatient = (patientId) =>
  apiClient.get(`/patients/${patientId}`);
export const createPatientForUser = (payload) =>
  apiClient.post("/patients/", payload);
export const deletePatient = (patientId) =>
  apiClient.delete(`/patients/${patientId}`);
