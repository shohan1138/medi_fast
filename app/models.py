from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from .database import Base
import datetime

# ---------------- USERS & ROLES ----------------

class Role(Base):
    __tablename__ = "roles"
    RoleId = Column(Integer, primary_key=True)
    RoleName = Column(String, unique=True)

    users = relationship("User", secondary="user_roles", back_populates="roles")


class User(Base):
    __tablename__ = "users"
    UserId = Column(Integer, primary_key=True)

    username = Column(String, unique=True)
    FullName = Column(String)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    phone_number = Column(String, unique=True)

    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    roles = relationship("Role", secondary="user_roles", back_populates="users")
    patients = relationship("Patient", back_populates="user")
    doctors = relationship("Doctor", back_populates="user")


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(Integer, ForeignKey("users.UserId"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.RoleId"), primary_key=True)


# ---------------- PATIENT & DOCTOR ----------------

class Patient(Base):
    __tablename__ = "patients"
    PatientId = Column(Integer, primary_key=True)
    UserId = Column(Integer, ForeignKey("users.UserId"))

    age = Column(Integer)
    blood_type = Column(String)
    gender = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    medical_history = Column(Text)

    user = relationship("User", back_populates="patients")
    appointments = relationship("Appointment", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"
    DoctorId = Column(Integer, primary_key=True)
    UserId = Column(Integer, ForeignKey("users.UserId"))

    specialty = Column(String)
    license_number = Column(String, unique=True)

    user = relationship("User", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"
    ScheduleId = Column(Integer, primary_key=True)
    DoctorId = Column(Integer, ForeignKey("doctors.DoctorId"))

    day_of_week = Column(String)
    start_time = Column(String)
    end_time = Column(String)

# ---------------- APPOINTMENT ----------------

class Appointment(Base):
    __tablename__ = "appointments"
    AppointmentId = Column(Integer, primary_key=True)

    PatientId = Column(Integer, ForeignKey("patients.PatientId"))
    DoctorId = Column(Integer, ForeignKey("doctors.DoctorId"))

    appointment_date = Column(DateTime)
    status = Column(String)
    notes = Column(Text)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

    medical_records = relationship("MedicalRecord", back_populates="appointment")
    prescriptions = relationship("Prescription", back_populates="appointment")
    invoices = relationship("Invoice", back_populates="appointment")

# ---------------- MEDICAL ----------------

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    RecordId = Column(Integer, primary_key=True)

    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"))

    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    visit_notes = Column(Text)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    appointment = relationship("Appointment", back_populates="medical_records")


class LabReport(Base):
    __tablename__ = "lab_reports"
    LabReportId = Column(Integer, primary_key=True)

    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"))

    test_name = Column(String)
    result = Column(Text)
    normal_range = Column(String)
    is_abnormal = Column(Boolean)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# ---------------- PRESCRIPTION ----------------

class Prescription(Base):
    __tablename__ = "prescriptions"
    PrescriptionId = Column(Integer, primary_key=True)

    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"))

    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)

    appointment = relationship("Appointment", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription")


class Medicine(Base):
    __tablename__ = "medicines"
    MedicineId = Column(Integer, primary_key=True)

    name = Column(String)
    category = Column(String)
    stock_quantity = Column(Integer)
    price = Column(DECIMAL(10, 2))


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    PrescriptionItemId = Column(Integer, primary_key=True)

    PrescriptionId = Column(Integer, ForeignKey("prescriptions.PrescriptionId"))
    MedicineId = Column(Integer, ForeignKey("medicines.MedicineId"))

    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)

    prescription = relationship("Prescription", back_populates="items")

# ---------------- BILLING ----------------

class Invoice(Base):
    __tablename__ = "invoices"
    InvoiceId = Column(Integer, primary_key=True)

    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"))

    total_amount = Column(DECIMAL(10, 2))
    status = Column(String)
    insurance_provider = Column(String)

    billing_date = Column(DateTime, default=datetime.datetime.utcnow)

    appointment = relationship("Appointment", back_populates="invoices")