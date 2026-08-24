from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Numeric, Enum, Date,Float,DECIMAL
from sqlalchemy.orm import relationship
from ..database import Base
import datetime
import enum
import uuid


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

    @property
    def FullName(self):
        return self.user.FullName if self.user else None
    
    appointments = relationship("Appointment", back_populates="patient")
    invoices = relationship("Invoice",back_populates="patient",)
    ward_assignments = relationship("WardAssignment")
    


class Doctor(Base):
    __tablename__ = "doctors"
    DoctorId = Column(Integer, primary_key=True)
    UserId = Column(Integer, ForeignKey("users.UserId"))

    specialty = Column(String)
    license_number = Column(String, unique=True)

    user = relationship("User", back_populates="doctors")

    @property
    def FullName(self):
        return self.user.FullName if self.user else None
    
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
    prescriptions = relationship("prescription", back_populates="appointment")
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

# ---------------- prescription ----------------

class prescription(Base):
    __tablename__ = "prescriptions"
    PrescriptionId = Column(Integer, primary_key=True)

    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"))

    issued_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)

    appointment = relationship("Appointment", back_populates="prescriptions")
    items = relationship("prescriptionItem", back_populates="prescription",cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"
    MedicineId = Column(Integer, primary_key=True)

    name = Column(String)
    category = Column(String)
    stock_quantity = Column(Integer)
    price = Column(Numeric(10, 2))


class prescriptionItem(Base):
    __tablename__ = "prescription_items"
    PrescriptionItemId = Column(Integer, primary_key=True)

    PrescriptionId = Column(Integer, ForeignKey("prescriptions.PrescriptionId"))
    medicine_name = Column(String, nullable=False)

    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)

    prescription = relationship("prescription", back_populates="items")

# ---------------- BILLING ----------------

class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class InvoiceItemType(str, enum.Enum):
    APPOINTMENT = "appointment"
    TEST = "test"
    WARD = "ward"
    BED = "bed"


class Ward(Base):
    __tablename__ = "wards"
    WardId = Column(Integer, primary_key=True)

    name = Column(String, nullable=False)
    daily_rate = Column(DECIMAL(10, 2), nullable=False)

    beds = relationship("Bed", back_populates="ward")


class Bed(Base):
    __tablename__ = "beds"
    BedId = Column(Integer, primary_key=True)
    WardId = Column(Integer, ForeignKey("wards.WardId"), nullable=False)

    bed_number = Column(String, nullable=False)
    is_occupied = Column(Boolean, default=False)

    ward = relationship("Ward", back_populates="beds")


class WardAssignment(Base):
    __tablename__ = "ward_assignments"
    WardAssignmentId = Column(Integer, primary_key=True)
    PatientId = Column(Integer, ForeignKey("patients.PatientId"), nullable=False)
    BedId = Column(Integer, ForeignKey("beds.BedId"), nullable=False)

    admitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    discharged_at = Column(DateTime, nullable=True)

    bed = relationship("Bed")
    patient = relationship("Patient",back_populates="ward_assignments",)


class Invoice(Base):
    __tablename__ = "invoices"
    InvoiceId = Column(Integer, primary_key=True)
    PatientId = Column(Integer, ForeignKey("patients.PatientId"), nullable=False)
    AppointmentId = Column(Integer, ForeignKey("appointments.AppointmentId"), nullable=True)

    total_amount = Column(DECIMAL(10, 2), default=0.0)
    status = Column(
        Enum(InvoiceStatus, name="invoicestatus", values_callable=lambda obj:[e.value for e in obj]),
        default=InvoiceStatus.PENDING,
    )
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    appointment = relationship("Appointment", back_populates="invoices")
    patient = relationship("Patient",back_populates="invoices",)
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    insurance_provider = Column(String, nullable=True)
    billing_date= Column(Date, default=datetime.date.today)


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    InvoiceItemId = Column(Integer, primary_key=True)
    InvoiceId = Column(Integer, ForeignKey("invoices.InvoiceId"), nullable=False)

    item_type = Column(
        Enum(InvoiceItemType,name="invoiceitemtype",values_callable=lambda obj:[e.value for e in obj]),
        nullable=False,
    )
    reference_id = Column(Integer, nullable=True)
    description = Column(String, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(DECIMAL(10, 2), default=1)
    subtotal = Column(DECIMAL(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")