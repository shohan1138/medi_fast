import apiClient from "./client";

// Invoices
export const createInvoice = (payload) =>
  apiClient.post("/billing/invoices", payload);
export const listInvoices = () => apiClient.get("/billing/invoices");
export const getInvoice = (invoiceId) =>
  apiClient.get(`/billing/invoices/${invoiceId}`);
export const updateInvoiceStatus = (invoiceId, status) =>
  apiClient.patch(`/billing/invoices/${invoiceId}/status`, null, {
    params: { status },
  });
export const getPatientInvoices = (patientId) =>
  apiClient.get(`/billing/patients/${patientId}/invoices`);

// Wards / Beds
export const listWards = () => apiClient.get("/billing/wards");
export const createWard = (payload) =>
  apiClient.post("/billing/wards", payload);
export const listBedsInWard = (wardId) =>
  apiClient.get(`/billing/wards/${wardId}/beds`);
export const createBed = (payload) => apiClient.post("/billing/beds", payload);

// Admission / Discharge
export const listWardAssignments = (activeOnly = true) =>
  apiClient.get("/billing/ward-assignments", {
    params: { active_only: activeOnly },
  });
export const admitPatient = (payload) =>
  apiClient.post("/billing/ward-assignments", payload);
export const dischargePatient = (assignmentId) =>
  apiClient.patch(`/billing/ward-assignments/${assignmentId}/discharge`);
