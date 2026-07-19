from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.utility.deps import get_current_user,get_db,require_admin
from app.schemas.prescription import(MedicalUpdate,MedicineCreate,MedicineResponse,prescriptionItemResponse,prescriptionCreate,prescriptionItemCreate,prescriptionItemUpdate,prescriptionResponse,prescriptionStatusUpdate)
from app.models import models

router=APIRouter(tags=["prescriptions"])

# ////////////Helper////////////////
def _get_doctor_or_403(db,current_user):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=403,detail="Doctor profile not found")
    return doctor

def _get_prescription_or_404(db,prescription_id):
    prescription=db.query(models.prescription).filter(
        models.prescription.prescriptionId==prescription_id
    ).first()
    if not prescription:
        raise HTTPException(status_code=404,detail="prescription not found")
    return prescription

def _is_doctor_of_appointment(db,doctor,appointment_id):
    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==appointment_id,
        models.Appointment.DoctorId==doctor.DoctorId
    ).first()
    if not appointment:
        raise HTTPException(
            status_code=403,
            detail="You can only manage prescriptions for your own appointments"
        )
    return appointment




# /////////////////prescriptions////////////////////////
prescription_router=APIRouter(prefix="/prescriptions",tags=["prescriptions"])

@prescription_router.post("/",response_model=prescriptionResponse,status_code=201)
def create_prescription(
    data:prescriptionCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles

    if not is_admin and "doctor" not in roles:
        raise HTTPException(status_code=403,detail="Only Doctor can create prescriptions")
    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==data.AppointmentId
    ).first()
    if not appointment:
        raise HTTPException(status_code=404,detail="Appointment not found")
    
    # completed appointment only 
    if appointment.status!="completed":
        raise HTTPException(status_code=400,detail=f"prescription can only br created for completed appointments."
                            f"Current status:'{appointment.status}'"
        )
    # doctor must own this appointment 
    if not is_admin:
        doctor=_get_doctor_or_403(db,current_user)
        _is_doctor_of_appointment(db, doctor, data.AppointmentId)

    # one prescription per appointment 
    existing=db.query(models.prescription).filter(
        models.prescription.AppointmentId==data.AppointmentId
    ).first()
    if existing:
        raise HTTPException(status_code=400,detail=f"prescription already exists for this appointment."
                            f"Use PATCH /prescriptions/{existing.prescriptionId}/items to add medicines."
        )
    prescription=models.prescription(AppointmentId=data.AppointmentId,status="active",)
    db.add(prescription)
    db.commit()

    return db.query(models.prescription).filter(
        models.prescription.AppointmentId==data.AppointmentId
    ).first()

# patient/doctor: view own prescriptions 
@prescription_router.get("/me",response_model=list[prescriptionResponse])
def my_prescriptions(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    
    if "doctor" in roles:
        doctor=_get_doctor_or_403(db,current_user)
        appointments=db.query(models.Appointment).filter(
            models.Appointment.DoctorId==doctor.DoctorId
        ).all()
        appointment_ids=[a.AppointmentId for a in appointments]
        return db.query(models.prescription).filter(
            models.prescription.AppointmentId.in_(appointment_ids)            
        ).all()
    
    if "patient" in roles:
        patient=db.query(models.Patient).filter(
            models.Patient.UserId==current_user.UserId
        ).first()
        if not patient:
            raise HTTPException(status_code=404,detail="Patient Profile not found")
        appointments=db.query(models.Appointment).filter(
            models.Appointment.PatientId==patient.PatientId
        ).all()
        appointment_ids=[a.AppointmentId for a in appointments]
        return db.query(models.prescription).filter(
            models.prescription.AppointmentId.in_(appointment_ids)
        ).all()
    raise HTTPException(status_code=403,detail="Access Denied")

# view single prescription 
@prescription_router.get("/{prescription_id}",response_model=prescriptionResponse)
def get_prescription(
    prescription_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "management" in roles
    
    prescription= _get_prescription_or_404(db,prescription_id)

    if is_admin:
        return prescription
    appointment=db.query(models.Appointment).filter(
        models.Appointment.AppointmentId==prescription.AppointmetnId
    ).filter()
    if "doctor" in roles:
        doctor =_get_doctor_or_403(db,current_user)
        if doctor.DoctorId==appointment.DoctorId:
            return prescription
        
    if "patient" in roles:
        patient=db.query(models.Patient).filter(
            models.Appointment.AppointmentId==prescription.AppointmentId
        ).first()
        if patient and patient.PatientId==appointment.PatientId:
            return prescription
        
    raise HTTPException(status_code=403,detail="Access Denied")

# # //////////////////Medicine///////////////////////////////
# medicine_router=APIRouter(prefix="/medicines",tags=["Medicines"])
# @medicine_router.post("/",response_model=MedicineResponse)
# def create_medicine(
#     data:MedicineCreate,
#     db:Session=Depends(get_db),
#     current_user=(get_current_user)
# ):
#     roles={r.RoleName for r in current_user.roles}
#     allowed={"admin","pharmacist"}
#     if not current_user.is_superuser and not (roles & allowed):
#         raise HTTPException(status_code=403,detail="Only admin or pharmacist can add medicines")
    
# ----------------------------------------------------
# ////////////prescription Item////////////////////
# --------------------------------------------

# doctor: add medicine to prescription 
@prescription_router.post("/{prescription_id}/items",response_model=prescriptionItemResponse,status_code=201)
def add_prescription_item(
    prescription_id:int,
    data:prescriptionItemCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles

    if not is_admin and "doctor" not in roles:
        raise HTTPException(status_code=403,detail="Only doctor can add prescription items")
    prescription=_get_prescription_or_404(db,prescription_id)

    if prescription.status != "active":
        raise HTTPException(
            status_code=400,detail=f"Cannot add items to a '{prescription.status}' prescription"
        )
    if not is_admin:
        doctor=_get_doctor_or_403(db,current_user)
        _is_doctor_of_appointment(db,doctor,prescription.AppointmentId)

    # check medicine exists 
    medicine=db.query(models.Medicine).filter(
        models.Medicine.MedicineId==data.MedicineId
    ).first()
    if not medicine:
        raise HTTPException(status_code=404,detail="Medicine not found")
    
    # no duplicate medicine in same prescription 
    duplicate=db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionId==prescription_id,
        models.prescriptionItem.MedicineId==data.MedicineId
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=400,detail=f"'{medicine.name}' is already in this prescription."
            f"Use PATCH to update dosage."
        )
    item=models.prescriptionItem(
        prescriptionId=prescription_id,
        MedicineId=data.MedicineId,
        dosage=data.dosage,
        frequency=data.frequency,
        duration=data.duration,
    )
    db.add(item)
    db.commit()

    return db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionId==prescription_id,
        models.prescriptionItem.MedicineId==data.MedicineId
    ).first()

# view all items in a prescription 
@prescription_router.get("/{prescription_id}/irems",response_model=list[prescriptionItemResponse])
def get_prescription_items(
    prescription_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    prescription= _get_prescription_or_404(db,prescription_id)
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles or "managment" in roles
    is_pharmacist="pharmacist" in roles
    
    if not is_admin and not is_pharmacist:
        appointment=db.query(models.Appointment).filter(
            models.Appointment.AppointmentId==prescription.AppointmentId
        ).first()
        if "doctor" in roles:
            doctor= _get_doctor_or_403(db,current_user)
            if doctor.DoctorId != appointment.DoctorId:
                raise HTTPException(status_code=403,detail="Access denied")
            elif "patient" in roles:
                patient=db.query(models.Patient).fiter(
                    models.Patient.UserId==current_user.UserId
                ).first()
                if not patient or patient.PatientId != appointment.PatientId:
                    raise HTTPException(status_code=403,detail="Access Denied")
            else:
                raise HTTPException(status_code=403,detail="Access Denied")
                
        return db.query(models.prescriptionItem).filter(
            models.prescriptionItem==prescription_id
        ).all()
            
# doctor: update prescription item 

@prescription_router.patch("/{prescription_id}/items/{item_id}",response_model=prescriptionItemResponse)
def update_prescription_item(
    prescription_id:int,
    item_id:int,
    data:prescriptionItemUpdate,
    db:Session =Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles

    if not is_admin and "doctor" not in roles:
        raise HTTPException(status_code=403,detail="Only doctors can update prescription itmes")
    prescription= _get_prescription_or_404(db,prescription_id)
    if prescription.status != "active":
        raise HTTPException(
            status_code=400,detail=f"Cannot update items in a '{prescription.status}' prescription"
        )
    item= db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionItemId==item_id,
        models.prescriptionItem.prescriptionId==prescription_id
    ).first()
    if not item:
        raise HTTPException(status_code=400,detail="No fields provided to update")
    
    db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionItemId==item_id
    ).update(updates)
    db.commit()

    return db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionItemId==item_id
    ).first()

# doctor: remove item from prescription 

@prescription_router.delete("/{prescription_id}/items/{item_id},status_code=200")
def delete_prescription_item(
    prescription_id:int,
    item_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    is_admin=current_user.is_superuser or "admin" in roles

    if not is_admin and "doctor" not in roles:
        raise HTTPException(status_code=403,detail= "Only doctor can remove prescription items")
    prescription= _get_prescription_or_404(db,prescription_id)
    if prescription.status != "active":
        raise HTTPException(
            status_code=400,detail=f"Cannot remove items from a '{prescription.status}' prescription"
        )
    item = db.query(models.prescriptionItem).filter(
        models.prescriptionItem.prescriptionItemId==item_id,
        models.prescriptionItem.prescriptionId==prescription_id
    ).first()
    if not item:
        raise HTTPException(status_code=404,detail="prescription item not found")
    db.delete(item)
    db.commit()
    return {"msg": f"Item {item_id} removed from prescription {prescription_id}"}

