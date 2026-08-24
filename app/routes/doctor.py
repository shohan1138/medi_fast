from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.utility.deps import get_db, get_current_user, require_admin
from app.schemas.doctor import(DoctorCreate,DoctorResponse,DoctorScheduleCreate,DoctorScheduleResponse,DoctorScheduleUpdate,DoctorUpdate,DoctorCreateForUser)
from app.models import models

router=APIRouter(prefix="/doctors",tags=["Doctors"])

# doctor create own profile 
@router.post("/me",response_model=DoctorResponse,status_code=201)
def create_my_profile(
    data:DoctorCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)

):
    roles= {r.RoleName for r in current_user.roles}
    if "doctor" not in roles and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="You Must have the 'doctor' role to create a doctor profile"
        )
    
    # one profile per user 
    existing=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if existing:
        raise HTTPException(status_code=400,detail="Doctor profile already exists. Use PATCH /doctors/me to update.")
    
    license_taken=db.query(models.Doctor).filter(
        models.Doctor.license_number==data.license_number).first()
    if license_taken:
        raise HTTPException(status_code=400,detail=f"license number '{data.license_number}'already registerd")
    
    doctor=models.Doctor(
        UserId=current_user.UserId,
        specialty=data.specialty,
        license_number=data.license_number,
        )
    
    db.add(doctor)
    db.commit()
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    return doctor

@router.post("/", response_model=DoctorResponse, status_code=201)
def create_doctor_for_user(
    data: DoctorCreateForUser,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    roles = {r.RoleName for r in current_user.roles}
    allowed = {"admin", "management"}
    if not current_user.is_superuser and not (roles & allowed):
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.UserId == data.UserId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.Doctor).filter(models.Doctor.UserId == data.UserId).first()
    if existing:
        raise HTTPException(status_code=400, detail="This user already has a doctor profile")

    license_taken = db.query(models.Doctor).filter(models.Doctor.license_number == data.license_number).first()
    if license_taken:
        raise HTTPException(status_code=400, detail=f"License number '{data.license_number}' already registered")

    doctor = models.Doctor(UserId=data.UserId, specialty=data.specialty, license_number=data.license_number)
    db.add(doctor)

    doctor_role = db.query(models.Role).filter(models.Role.RoleName == "doctor").first()
    if doctor_role and doctor_role not in user.roles:
        user.roles.append(doctor_role)

    db.commit()
    db.refresh(doctor)
    return doctor

# doctor:view own profile 
@router.get("/me",response_model=DoctorResponse)
def get_my_profile(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="No doctor profile found.Create one with POST /doctors/me")
    return doctor

# doctor :update own profile 
@router.patch("/me",response_model=DoctorResponse)
def update_my_profile(
    data:DoctorUpdate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor Profile not found")
    updates=data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400,detail="No fields provided to update")
    

    # if license numver is veing changed check it is not taken 
    if "license_number" in updates:
        license_taken=db.query(models.Doctor).filter(
            models.Doctor.license_number==updates["license_number"],
            models.Doctor.DoctorId != doctor.DoctorId
        ).first()
        if license_taken:
            raise HTTPException(
                status_code=400,
                detail=f"License number '{updates['license_number']}' already registered"
            )
    db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).update(updates)

    db.commit()
    db.refresh(doctor)
    return doctor
    
# anyone logged in: list all doctors 
@router.get("/",response_model=list[DoctorResponse])
def list_doctors(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(models.Doctor).all()

# anyone logged in : get single doctor 
@router.get("/{doctor_id}",response_model=DoctorResponse)
def get_doctor(
    doctor_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.DoctorId==doctor_id
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="Doctoe not found")
    return doctor

# admin/management: update any doctor's profile
@router.patch("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    roles = {r.RoleName for r in current_user.roles}
    if not current_user.is_superuser and not (roles & {"admin", "management"}):
        raise HTTPException(status_code=403, detail="Admin or management access required")

    doctor = db.query(models.Doctor).filter(models.Doctor.DoctorId == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "license_number" in updates:
        license_taken = db.query(models.Doctor).filter(
            models.Doctor.license_number == updates["license_number"],
            models.Doctor.DoctorId != doctor_id
        ).first()
        if license_taken:
            raise HTTPException(status_code=400, detail=f"License number '{updates['license_number']}' already registered")

    db.query(models.Doctor).filter(models.Doctor.DoctorId == doctor_id).update(updates)
    db.commit()
    db.refresh(doctor)
    return doctor

# admin only: delete doctor profile 
@router.delete("/{doctor_id}",status_code=200,dependencies=[Depends(require_admin)])
def delete_doctor(doctor_id:int,db:Session=Depends(get_db)):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.DoctorId==doctor_id
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"msg": f"Doctor {doctor_id} deleted"}

# doctor schedule 
 
# doctor add a schedule slot 
@router.post("/me/schedule", response_model=DoctorScheduleResponse, status_code=201)
def add_schedule(
    data:DoctorScheduleCreate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)

):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found.Create one first with POST /doctors/me"
        )
# prevent duplicate day slot 
    duplicate=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId==doctor.DoctorId,
        models.DoctorSchedule.day_of_week== data.day_of_week
    ).first()
    if duplicate: 
        raise HTTPException(
        status_code=400,
        detail=f"Schedule for {data.day_of_week} already exists. Use PATCH to update it"
        )

    schedule=models.DoctorSchedule(
        DoctorId=doctor.DoctorId,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
    )

    db.add(schedule)
    db.commit()
    schedule=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId==doctor.DoctorId,
        models.DoctorSchedule.day_of_week==data.day_of_week
    ).first()
    return schedule

# doctor : view own schedule 
@router.get("/me/schedule",response_model=list[DoctorScheduleResponse])
def get_my_schedule(
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor = db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="Doctor profile not found")
    
    return db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId==doctor.DoctorId
    ).all()

# doctor: update a schedule slot 
@router.patch("/me/schedule/{schedule_id}",response_model=DoctorScheduleResponse)
def update_schedule(
    schedule_id:int,
    data:DoctorScheduleUpdate,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor =db.query(models.Doctor).filter(
        models.Doctor.UserId==current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="Doctor profile not found")
    schedule=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.ScheduleId==schedule_id,
        models.DoctorSchedule.DoctorId==doctor.DoctorId
    ).first()
    
    if not schedule: raise HTTPException(status_code=404,detail="Schedule slot not found")
    updates=data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400,detail="No field provided to update")
    db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.ScheduleId==schedule_id
    ).update(updates)

    db.commit()
    schedule=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.ScheduleId==schedule_id
    ).first()
    return schedule

# doctor: delete a schedule slot
@router.delete("/me/schedule/{schedule_id},status_code=200")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor = db.query(models.Doctor).filter(
        models.Doctor.UserId == current_user.UserId
    ).first()
    if not doctor:
        raise HTTPException(status_code=404,detail="Doctor profile not found")
    schedule=db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.ScheduleId==schedule_id,
        models.DoctorSchedule.DoctorId==doctor.DoctorId
    ).first()
    if not schedule:
        raise HTTPException(status_code=404,detail="Schedule slot not found")
    
    db.delete(schedule)
    db.commit()
    return{"msg":f"Schedule slot {schedule_id} deleted"}

# anyone logged in view a doctor schedule 
@router.get("/{doctor_id}/schedule",response_model=list[DoctorScheduleResponse])
def get_doctor_schedule(
    doctor_id:int,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    doctor=db.query(models.Doctor).filter(
        models.Doctor.DoctorId==doctor_id
    ).first()
    
    if not doctor:
        raise HTTPException(status_code=404,detail="doctor not found")
    
    return db.query(models.DoctorSchedule).filter(
        models.DoctorSchedule.DoctorId==doctor_id
    ).all()