from pydantic import BaseModel
from typing import Optional

class patientCreate(BaseModel):
    
    age:int
    blood_type:str
    gender:str
    emergency_contact_name:str
    emergency_contact_phone:str
    medical_history: Optional[str]=None

class PatientUpdate(BaseModel):
    age:Optional[int]=None
    blood_type:Optional[str]=None
    gender:Optional[str]=None
    emergency_contact_name:Optional[str]=None
    emergency_contact_phone:Optional[str]=None
    medical_history: Optional[str] = None

class PatientResponse(BaseModel):
    PatientId:int
    UserId:int
    age:int 
    blood_type:str
    gender:str    
    emergency_contact_name:str
    emergency_contact_phone:str
    medical_history:Optional[str]
    FullName: Optional[str] = None
    model_config={"from_attributes":True}

class PatientCreateForUser(BaseModel):
    UserId: int
    age: int
    blood_type: str
    gender: str
    emergency_contact_name: str
    emergency_contact_phone: str
    medical_history: Optional[str] = None