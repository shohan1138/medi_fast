import apiClient from "./client";

export const getReportsSummary = (year, month) =>
  apiClient.get("/reports/summary", { params: { year, month } });
export const getRevenueByWard = (year, month) =>
  apiClient.get("/reports/revenue-by-ward", { params: { year, month } });
export const getDoctorAppointmentLoad = (year, month) =>
  apiClient.get("/reports/doctor-appointment-load", {
    params: { year, month },
  });
export const getRevenueByServiceType = (year, month) =>
  apiClient.get("/reports/revenue-by-service-type", {
    params: { year, month },
  });
