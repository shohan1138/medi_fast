from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class AppointmentStatus(str,Enum):
    scheduled="scheduled"
    completed="completed"
    cancelled="cancelled"
    no_show="no_show"

class AppointmentCreate(BaseModel):
    PatientId:int
    DoctorId:int
    appointment_date:datetime
    notes:Optional[str]=None
    status:AppointmentStatus=AppointmentStatus.scheduled

class AppointmentUpdate(BaseModel):
    appointment_date:Optional[datetime]=None
    status:Optional[AppointmentStatus]=None
    notes:Optional[str]=None

class AppointmentResponse(BaseModel):
    AppointmentId:int
    PatientId:int
    DoctorId:int
    appointment_date:datetime
    status:str
    notes:Optional[str]
    model_config={"from_attributes":True}