from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.utility.deps import get_current_user,get_db,require_admin
from app.schemas.patient import patientCreate,PatientResponse,PatientUpdate
from app.models import models

router=APIRouter(prefix="/patients",tags=["Patients"])

@router.post("/me",response_model=PatientResponse,status_code=201)
def create_my_profile(
    data:patientCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    if "patient" not in roles and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="You must have the 'patient' role tp create a patient profiles"
        )
    existing=db.query(models.Patient).filter(
        models.Patient.UserId == current_user.UserId
    ).first()
    if existing:    
        raise HTTPException(
            status_code=400,
            detail="Patient profile already exists.Use PATCH /patients/me to update."
        )
    patient=models.Patient(
        UserId=current_user.UserId,
        age=data.age,
        blood_type=data.blood_type,
        gender=data.gender,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        medical_history=data.medical_history,
    )
    db.add(patient)
    db.commit()
    patient=db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).first()
    return patient
    
# patient view own profile
@router.get("/me",response_model=PatientResponse)
def get_my_profile(
        db:Session=Depends(get_db),
        current_user=Depends(get_current_user)
):
        patient =db.query(models.Patient).filter(
            models.Patient.UserId==current_user.UserId
        ).first()
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="No patient profile found.Create one with POST /patients/me"    
            )
        return patient

# patient:update own profile
@router.patch("/me",response_model=PatientResponse)
def update_my_profile(
    data:PatientUpdate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient=db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).first()
    if not patient:
        raise HTTPException(status_code=404,detail="Patient profile not found")
    updates=data.model_dump(exclude_none=True)

    if not updates:
        raise HTTPException(status_code=400,detail="No field provided to update")
    
    db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).update(updates)
    
    db.commit()
    patient=db.query(models.Patient).filter(
        models.Patient.UserId==current_user.UserId
    ).first()
    return patient

# admin /managment : list all patient 
@router.get("/",response_model=list[PatientResponse])                                
def list_patients(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)

):
    roles={r.RoleName for r in current_user.roles}
    allowed={"admin","managment","doctor","nurse"}
    if not current_user.is_superuser and not (roles & allowed):
        raise HTTPException(status_code=403,detail="Access Denied")
    return db.query(models.Patient).all()

# admin/doctor :get single patient by id 
@router.get("/{patient_id}",response_model=PatientResponse)
def get_parient(
    patient_id=int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles={r.RoleName for r in current_user.roles}
    allowed={"admin","managment","doctor","nurse"}
    if not current_user.is_superuser and not (roles & allowed):
        raise HTTPException(status_code=403,detail="Access Denied")
    patient=db.query(models.Patient).filter(
        models.Patient.PatientId==patient_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404,detail="Patient not found")
    return patient

# admin only :delete patient profile 
@router.delete("/{patient_id}",status_code=200,
               dependencies=[Depends(require_admin)])
def delete_patient(patient_id:int,db:Session=Depends(get_db)):
    patient=db.query(models.Patient).filter(
        models.Patient.PatientId==patient_id).first
    if not patient:
        raise HTTPException(status_code=404,detail="Patient not found")
    db.delete(patient)
    db.commit()
    return{"msg":f"Patient {patient_id} deleted"}
    
    