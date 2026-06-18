from scipy import stats

from app.schemas.appointment import(AppointmentCreate,AppointmentResponse,AppointmentStatus,AppointmentUpdate)
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.org import Session
from datetime import datetime
from app.utility.deps import get_db,get_current_user
from app.models import models

router=APIRouter(prefix="/appointments",tags=["Appointment"])

# helper 
def _get_patient_profile(db,current_user):
    patient =db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).first()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found. create one with POST /patient/me"
        )
    return patient

def _validate_schedule(db,doctor_id,appointment_data):
    day_name=appointment_data.strftime("%A")

    schedules=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId==doctor_id,
        models.DoctorSchedule.day_of_week==day_name
    ).all()

    if not schedules:
        raise HTTPException(
            status_code=400,
            detail=f"Doctor is not available on {day_name}"
        )
    appt_time=appointment_data.time()
    for slot in schedules:
        start=datetime.strptime(slot.start_time, "%H:%M").time()
        end= datetime.strptime(slot.end_time, "%H:%M").time()
        if start<=appt_time<=end:
            return
        
    raise HTTPException(
        status_code=400,
        detail=f"Doctor is not available at {appt_time.strftime('%H:%M')} on {day_name}"
    )
def _check_double_booking(db, doctor_id,appointment_date,exclude_id=None):
    # block two active appountment at the exact same time for the same time 
    query=db.query(models.Appointment).fiter(
        models.Appointment.DoctorId== doctor_id,
        models.Appointment.appointment_date==appointment_date,
        models.Appointment.status.in_(["pending","confirmed"])
    )

    if exclude_id:
        query=query.filter(models.Appointment.AppointmentId !=exclude_id)

    if query.first():
        raise HTTPException(status_code=400,detail="This time slot is already booked")
    
# ENDPONTS 

# patient book an appointment 
@router.post("/",response_model=AppointmentResponse,status_code=201)
def book_appointment(
    data:AppointmentCreate,
    db: Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles ={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "managment" in roles

    if is_admin:
        # admin /managment can book on behalf of any paatient using body's patientId
        patient_id=data.PatientId
        patient=db.query(models.Patient).filter(
            models.Patient.PatientId ==patient_id
        ).first()
        if not patient:
            raise HTTPException(status_code=404,detail="Patient not found")
    else:
        if "patient" not in roles:
            raise HTTPException(status_code=403,detail="Only patient can book appointments")
        patient=_get_patient_profile(db, current_user)
        patient_id=patient.PatientId

    doctor=db.query(models.Doctor).filter(
        models.Doctor.DoctorId==data.DoctorId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="Doctor not found")
        
    _validate_schedule(db, data,DoctorId, data.appointment_date)
    _check_double_booking(db,data.DoctorId,data.appointment_date)
        
    appointment=models.Appointment(
        PatientId=patient_id,
        DoctorId=data.DoctorId,
        appointment_date=data.appointment_date,
        status=AppointmentStatus.scheduled.value,
        notes=data.notes,
    )
    db.add(appointment)
    db.commit()

    appointment=db.query(models.Appointment).filter(
        models.Appointment.PatientId==patient_id,
        models.Appointment.DoctorId==data.DoctorId,
        models.Appointment.appointment_date==data.appointment_date
    ).first()
    return appointment
    
# doctor/admin:update appointment stats 
@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_status(
    appointment_id:int,
    status:AppointmentStatus,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404,detail="Appointment not found")
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "managment" in roles

    is_owner_doctor=False
    if "doctor" in roles:
        doctor= db.query(models.Doctor).filter(
            models.Doctor.UserId==current_user.UserId
        ).first()
        if doctor and doctor.DoctorId== appointment.DoctorId:
            is_owner_doctor=True

    if not (is_admin or is_owner_doctor):
        raise HTTPException(status_code=403,detail="Only the assigned doctor or admin can update status")
    
    db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==appointment_id
    ).update({"status":status.value})
    db.commit()

    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==appointment_id
    ).first()
    return appointment

# patient /doctor :view own appointments 

@router.get("/me",response_model=list[AppointmentResponse])
def my_appointment(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}

    if "doctor" in roles:
        doctor=db.query(models.Doctor).filter(
            models.Doctor.UserId==current_user.UserId
        ).first()
        if not doctor:
            raise HTTPException(status_code=404,detail="Doctor profile not found")
        return db.query(models.Appointment).filter(
            models.Appointment.DoctorId==doctor.DoctorId
        ).all()
    if "patient" in roles:
        patient=db.query(models.Patient).filter(
            models.Patient.UserId==current_user.UserId
        ).first()
        if not patient:
            raise HTTPException(status_code=404,detail="Patient profile not found")
        return db.query(models.Appointment).filter(
            models.Appointment.PatientId==patient.PatientId
        ).all()
    raise HTTPException(status_code=403,detail="No patient or doctor profile on this account")

# admin/managment:list all appointment 
@router .get("/",response_model=list[AppointmentResponse])
def list_appoinments(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    allowed={"admin","managment"}
    if not current_user.is_superuser and not (roles & allowed):
        raise HTTPException(status_code=403, detail="Access Denied")
    return db.query(models.Appointment).all()

# view a single appointment (owner or admin) 
@router.get("/{appointment_id}",response_model=AppointmentResponse)
def get_appointment(
    appointment_id:int,
    db:Session =Depends(get_db),
    current_user=Depends(get_current_user)
).first()
if not appointment:
    raise HTTPException(status_code=404,detail="Appointment not found")
roles={r.RoleName for r in current_user.roles}
if current_user.is_superuser or "admin" in roles or "mangment" in roles:
    return appointment

if "patient" in roles:
    patient= db.query(models.Patient).filter(
        models.Patient.UserId==Current_user.UserId
    ).first()
    if patient and patient.PatientId == appointment.PatientId:
        return appointment

if "doctor" in roles:
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if doctor and doctor.DoctorId == appointment.DoctorId:
        return appointment
    raise HTTPException(status_code=403,detail="Access Denied")
