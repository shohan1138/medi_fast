from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.utility.deps import get_db, get_current_user
from app.schemas.appointment import (
    AppointmentCreate, AppointmentResponse, AppointmentStatus, AppointmentUpdate
)
from app.models import models

router = APIRouter(prefix="/appointments", tags=["Appointment"])


# ── helpers ────────────────────────────────────────────────
def _check_status_transition(current_status:str,new_status:str):
    allowed_transitions={
        "scheduled": ["completed","cancelled"],
        "completed": [],
        "cancelled": [],
    }
    if new_status not in allowed_transitions.get(current_status,[]):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status form '{current_status}' to '{new_status}'"
        )
    
def _get_patient_profile(db, current_user):
    patient = db.query(models.Patient).filter(
        models.Patient.UserId == current_user.UserId
    ).first()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found. Create one with POST /patients/me"
        )
    return patient


def _validate_schedule(db, doctor_id, appointment_date):
    day_name = appointment_date.strftime("%A")
    schedules = db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId == doctor_id,
        models.DoctorSchedule.day_of_week == day_name
    ).all()
    if not schedules:
        raise HTTPException(
            status_code=400,
            detail=f"Doctor is not available on {day_name}"
        )
    appt_time = appointment_date.time()
    for slot in schedules:
        start = datetime.strptime(slot.start_time, "%H:%M").time()
        end = datetime.strptime(slot.end_time, "%H:%M").time()
        if start <= appt_time <= end:
            return
    raise HTTPException(
        status_code=400,
        detail=f"Doctor is not available at {appt_time.strftime('%H:%M')} on {day_name}"
    )


def _check_double_booking(db, doctor_id, appointment_date, exclude_id=None):
    query = db.query(models.Appointment).filter(
        models.Appointment.DoctorId == doctor_id,
        models.Appointment.appointment_date == appointment_date,
        models.Appointment.status.in_(["scheduled"])     # ← matches your enum
    )
    if exclude_id:
        query = query.filter(models.Appointment.AppointmentId != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail="This time slot is already booked")


# ── ENDPOINTS ──────────────────────────────────────────────

# patient: book an appointment
@router.post("/", response_model=AppointmentResponse, status_code=201, summary="Book Appointment")
def book_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles = {r.RoleName for r in current_user.roles}
    is_admin = current_user.is_superuser or "admin" in roles or "management" in roles

    if is_admin:
        patient_id = data.PatientId
        patient = db.query(models.Patient).filter(
            models.Patient.PatientId == patient_id
        ).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
    else:
        if "patient" not in roles:
            raise HTTPException(status_code=403, detail="Only patients can book appointments")
        patient = _get_patient_profile(db, current_user)
        patient_id = patient.PatientId

    doctor = db.query(models.Doctor).filter(
        models.Doctor.DoctorId == data.DoctorId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    _validate_schedule(db, data.DoctorId, data.appointment_date)      # ← dot not comma
    _check_double_booking(db, data.DoctorId, data.appointment_date)

    appointment = models.Appointment(
        PatientId=patient_id,
        DoctorId=data.DoctorId,
        appointment_date=data.appointment_date,
        status=AppointmentStatus.scheduled.value,
        notes=data.notes,
    )
    db.add(appointment)
    db.commit()

    appointment = db.query(models.Appointment).filter(
        models.Appointment.PatientId == patient_id,
        models.Appointment.DoctorId == data.DoctorId,
        models.Appointment.appointment_date == data.appointment_date
    ).first()
    return appointment


# doctor/admin: update appointment status
@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_status(
    appointment_id: int,
    status: AppointmentStatus,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    # fetch the appointment 
    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # check transition is allowed 
    _check_status_transition(appointment.status,status.value)
    
    # check permissions 
    roles = {r.RoleName for r in current_user.roles}
    is_admin = current_user.is_superuser or "admin" in roles or "management" in roles

    is_owner_doctor = False
    if "doctor" in roles:
        doctor = db.query(models.Doctor).filter(
            models.Doctor.UserId == current_user.UserId
        ).first()
        if doctor and doctor.DoctorId == appointment.DoctorId:
            is_owner_doctor = True

    if not (is_admin or is_owner_doctor):
        raise HTTPException(status_code=403, detail="Only the assigned doctor or admin can update status")

    # apply the update 
    db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).update({"status": status.value})
    db.commit()

    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    return appointment


# patient/doctor: view own appointments
@router.get("/me", response_model=list[AppointmentResponse])
def my_appointment(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles = {r.RoleName for r in current_user.roles}

    if "doctor" in roles:
        doctor = db.query(models.Doctor).filter(
            models.Doctor.UserId == current_user.UserId
        ).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        return db.query(models.Appointment).filter(
            models.Appointment.DoctorId == doctor.DoctorId
        ).all()

    if "patient" in roles:
        patient = db.query(models.Patient).filter(
            models.Patient.UserId == current_user.UserId
        ).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        return db.query(models.Appointment).filter(
            models.Appointment.PatientId == patient.PatientId
        ).all()

    raise HTTPException(status_code=403, detail="No patient or doctor profile on this account")


# admin/management: list all appointments
@router.get("/", response_model=list[AppointmentResponse], summary="List all Appointments (only for Admin and Management)")
def list_appointments(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles = {r.RoleName for r in current_user.roles}
    allowed = {"admin", "management"}
    if not current_user.is_superuser and not (roles & allowed):
        raise HTTPException(status_code=403, detail="Access Denied")
    return db.query(models.Appointment).all()


# view a single appointment (owner or admin)
@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):                                                      # ← body properly indented inside function
    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    roles = {r.RoleName for r in current_user.roles}
    if current_user.is_superuser or "admin" in roles or "management" in roles:
        return appointment

    if "patient" in roles:
        patient = db.query(models.Patient).filter(
            models.Patient.UserId == current_user.UserId    # ← lowercase current_user
        ).first()
        if patient and patient.PatientId == appointment.PatientId:
            return appointment

    if "doctor" in roles:
        doctor = db.query(models.Doctor).filter(
            models.Doctor.UserId == current_user.UserId
        ).first()
        if doctor and doctor.DoctorId == appointment.DoctorId:
            return appointment

    raise HTTPException(status_code=403, detail="Access Denied")


# patient: reschedule own appointment (scheduled only)
@router.patch("/{appointment_id}", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = db.query(models.Patient).filter(
        models.Patient.UserId == current_user.UserId    # ← ) not ]
    ).first()
    if not patient or patient.PatientId != appointment.PatientId:
        raise HTTPException(status_code=403, detail="You can only reschedule your own appointments")

    if appointment.status != "scheduled":               # ← "scheduled" not "pending"
        raise HTTPException(status_code=400, detail="Only scheduled appointments can be rescheduled")

    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "appointment_date" in updates:
        new_date = updates["appointment_date"]
        _validate_schedule(db, appointment.DoctorId, new_date)
        _check_double_booking(db, appointment.DoctorId, new_date, exclude_id=appointment_id)

    db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).update(updates)
    db.commit()                                         # ← outside if block, always runs

    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    return appointment                                  # ← outside if block, always returns


# patient/admin: cancel appointment
@router.delete("/{appointment_id}", status_code=200)   # ← quote closed before comma
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if appointment.status in ("completed","cancelled"):
        raise HTTPException(status_code=400,detail=f"Cannot cancel an appointment that is already '{appointment.status}'")
    
    roles = {r.RoleName for r in current_user.roles}
    is_admin = current_user.is_superuser or "admin" in roles or "management" in roles

    is_owner_patient = False
    if "patient" in roles:
        patient = db.query(models.Patient).filter(
            models.Patient.UserId == current_user.UserId
        ).first()
        if patient and patient.PatientId == appointment.PatientId:
            is_owner_patient = True

    if not (is_admin or is_owner_patient):              # ← outside if "patient" block
        raise HTTPException(status_code=403, detail="You can only cancel your own appointments")

    db.query(models.Appointment).filter(
        models.Appointment.AppointmentId == appointment_id
    ).update({"status": "cancelled"})
    db.commit()
    return {"msg": f"Appointment {appointment_id} cancelled"}