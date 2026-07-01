from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.utility.deps import get_current_user,get_db,require_admin
from app.schemas.medical.import(
    MedicalRecordCreate,MedicalRecordResponse,MedicalRecordUpdate,LabReportCreate,LabReportResponse,LabReportUpdate,
)
from app.models import models
router=APIRouter(tags=["Medical"])


# ///////////helper/////////////

def _get_appointment_or_404(db,appointment_id):
    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404,detail="Appointment not found")
    return appointment

def _is_doctor_of_appoinment(db.current_user,appointment):
    doctor =db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user_UserId
    ).first()
    if not doctor or doctor.DoctorId!= appointment.DoctorId:
        raise HTTPException(
            status_code=403,
            detail="You can only Manage records for your own appointments"
        )
    return doctor

def _is_patient_of_appointment(db,current_user,appointment):
    patient=db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).first()
    if not patient or patient.PatientId !=appointment.PatientId:
        raise HTTPException(
            status_code=403,detail="you can only view records for your own appointments"
        )
    return patient

# medical Records 
medical_router=APIRouter(prefix="/medical-records",tags=["Medical Records"])

# doctor: create a medical record 
@medical_router.post("/",response_model=MedicalRecordResponse,status_code=201)
def create_medical_records(
    data:MedicalRecordCreate,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles

    if not is_admin and "doctor" not in roles:
        raise HTTPException(status_code=403,detail="Only Doctor can create medical records")
    appointment= _get_appointment_or_404(db,data.AppointmentId)

    # must be completed appointment 
    if appointment.status !="completed":
        raise HTTPException(
            status_code=400,
            detail=f"Medical records can only be created for completed appointments."
                    f"Current status:'{appointment.status}'"
        )
    # doctor must own this appointment 
    if not is_admin:
        _is_doctor_of_appoinment(db,current_user,appointment)

    # one record per appointment 
    existing=db.query(models.MedicalRecord).filter(
        models.MedicalRecord.AppointmentId==data.AppointmentId
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,detail="Medical record already exists for this appointment. Use PATCH to update"
        )
    record=models.MedicalRecord(
        AppointmentId=data.AppointmentId,
        diagnosis=data.diagnosis,
        treatment_plan=data.treatment_plan,
        visit_notes=data.visit.notes,
    )
    db.add(record)
    db.commit()

    record=db.query(models.MedicalRecord).filter(
        models.MedicalRecord.AppointmentId==data.AppointmentId
    ).first()
    return record

# view record by appointment Id 
@medical_router.get("/appointment/{appointment_id}",response_model=MedicalRecordResponse)

def get_record_by_appointment(
    appointment_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "managment" in roles
    appointment=_get_appointment_or_404(db,appointment_id)

    # permission check 
    if not is_admin:
        if "doctor" in roles:
            _is_doctor_of_appoinment(db,current_user,appointment)
        elif "patient" in roles:
            _is_patient_of_appointment(db,current_user,appointment)
        else:
            raise HTTPException(status_code=403,detail="Access Denied")
        
        record=db.query(models.MedicalRecord).filter(
            models.MedicalRecord.AppointmentId==appointment_id
        ).first()
        if not record:
            raise HTTPException(status_code=404,detail="No medical record found for this appointment")
        return record
    
# view single record by recordId 

@medical_router.get("/{record_id}",response_model=MedicalRecordResponse)
def get_medical_record(
    record_id:int,
    db:Session=Depends(get_db),
    current_user=Depends
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "managment" in roles

    record=db.query(models.MedicalRecord).filter(
        models.MedicalRecord.RecordId==record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404,detail="Medical record not found")
    if not is_admin:
        appointment=get_appointment_or_404(db,record.AppointmentId)
        if "doctor" in roles:
            _is_doctor_of_appoinment(db,current_user,appointment)
        elif "patient" in roles:
            _is_patient_of_appointment(db,current_user,appointment)
        else:
            raise HTTPException(stauts_code=403,detail="Access Denied")
        
    return record

# doctor: update a medicla record 
    
