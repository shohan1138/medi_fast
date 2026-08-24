import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import UserManagementPage from "./pages/UserManagementPage";
import BillingPage from "./pages/BillingPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import InvoiceListPage from "./pages/InvoiceListPage";
import WardAdmissionPage from "./pages/WardAdmissionPage";
import PatientsHomePage from "./pages/patients/PatientsHomePage";
import PatientListPage from "./pages/patients/PatientListPage";
import PatientDetailPage from "./pages/patients/PatientDetailPage";
import CreatePatientPage from "./pages/patients/CreatePatientPage";
import MyPatientProfilePage from "./pages/patients/MyPatientProfilePage";
import DoctorsHomePage from "./pages/doctors/DoctorsHomePage";
import DoctorListPage from "./pages/doctors/DoctorListPage";
import DoctorDetailPage from "./pages/doctors/DoctorDetailPage";
import CreateDoctorPage from "./pages/doctors/CreateDoctorPage";
import MyDoctorProfilePage from "./pages/doctors/MyDoctorProfilePage";
import AppointmentHomePage from "./pages/appointments/AppointmentHomePage";
import BookAppointmentPage from "./pages/appointments/BookAppointmentPage";
import MyAppointmentsPage from "./pages/appointments/MyAppointmentsPage";
import AppointmentListPage from "./pages/appointments/AppointmentListPage";
import AppointmentDetailPage from "./pages/appointments/AppointmentDetailPage";
import MedicalRecordPage from "./pages/medical/MedicalRecordPage";
import LabReportsPage from "./pages/medical/LabReportsPage";
import PrescriptionsHomePage from "./pages/prescriptions/PrescriptionsHomePage";
import MyPrescriptionsPage from "./pages/prescriptions/MyPrescriptionsPage";
import AllPrescriptionsPage from "./pages/prescriptions/AllPrescriptionsPage";
import PrescriptionDetailPage from "./pages/prescriptions/PrescriptionDetailPage";
import AppointmentPrescriptionPage from "./pages/prescriptions/AppointmentPrescriptionPage";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route element={<AppLayout />}>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/appointments/:appointmentId/medical-record"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "doctor",
                        "patient",
                      ]}
                    >
                      <MedicalRecordPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/:appointmentId/lab-reports"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "doctor",
                        "patient",
                        "lab_technician",
                      ]}
                    >
                      <LabReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePasswordPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "management"]}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "receptionist",
                        "doctor",
                        "nurse",
                      ]}
                    >
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/billing/invoices"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
                      <InvoiceListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing/invoices/new"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
                      <CreateInvoicePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing/invoices/:invoiceId"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
                      <InvoiceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing/wards"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "receptionist",
                        "nurse",
                        "doctor",
                      ]}
                    >
                      <WardAdmissionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients"
                  element={
                    <ProtectedRoute>
                      <PatientsHomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients/list"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "doctor",
                        "nurse",
                        "lab_technician",
                        "receptionist",
                      ]}
                    >
                      <PatientListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients/new"
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "management", "receptionist"]}
                    >
                      <CreatePatientPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients/me"
                  element={
                    <ProtectedRoute allowedRoles={["patient"]}>
                      <MyPatientProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patients/:patientId"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "doctor",
                        "nurse",
                        "lab_technician",
                        "receptionist",
                      ]}
                    >
                      <PatientDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/doctors"
                  element={
                    <ProtectedRoute>
                      <DoctorsHomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors/list"
                  element={
                    <ProtectedRoute>
                      <DoctorListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors/new"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "management"]}>
                      <CreateDoctorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors/me"
                  element={
                    <ProtectedRoute allowedRoles={["doctor"]}>
                      <MyDoctorProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors/:doctorId"
                  element={
                    <ProtectedRoute>
                      <DoctorDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <AppointmentHomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/book"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "patient",
                        "admin",
                        "management",
                        "receptionist",
                      ]}
                    >
                      <BookAppointmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/me"
                  element={
                    <ProtectedRoute allowedRoles={["patient", "doctor"]}>
                      <MyAppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/list"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "receptionist",
                        "lab_technician",
                      ]}
                    >
                      <AppointmentListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/:appointmentId"
                  element={
                    <ProtectedRoute>
                      <AppointmentDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions"
                  element={
                    <ProtectedRoute>
                      <PrescriptionsHomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions/me"
                  element={
                    <ProtectedRoute allowedRoles={["doctor", "patient"]}>
                      <MyPrescriptionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions/list"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "management"]}>
                      <AllPrescriptionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions/:prescriptionId"
                  element={
                    <ProtectedRoute>
                      <PrescriptionDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/:appointmentId/prescription"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "management",
                        "doctor",
                        "patient",
                      ]}
                    >
                      <AppointmentPrescriptionPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
