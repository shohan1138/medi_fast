from pydantic import BaseModel
from typing import Optional

# Doctor
class DoctorCreate(BaseModel):
    UserId:int
    specialty:str
    license_number:str

class DoctorUpdate(BaseModel):
    specialty:Optional[str]=None
    license_number:Optional[str]=None

class DoctorResponse(BaseModel):
    DoctorId:int
    UserId:int
    specialty:str
    license_number:str
    model_config={"from_attributes":True}
# doctoe schedule

class DoctorScheduleCreate(BaseModel):
    DoctorId:int
    day_of_week:str
    start_time:str
    end_time:str

class DoctorScheduleUpdate(BaseModel):
    day_of_week:Optional[str]=None
    start_time:Optional[str]=None
    end_time:Optional[str]=None

class DoctorScheduleResponse(BaseModel):
    ScheduleId:int
    DoctorId:int
    day_of_week:str
    start_time:str
    end_time:str
    model_config={"from_attributes":True}