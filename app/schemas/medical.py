from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# medical record

class MedicalRecordCreate(BaseModel):
    AppointmentId:int
    diagnosis:str
    treatment_plan:Optional[str]=None
    visit_nodes:Optional[str]=None

class MedicalRecordUpdate(BaseModel):
    diagnosis:Optional[str]=None
    treatment_plan:Optional[str]=None
    visit_notes:Optional[str]=None

class MedicalRecordResponse(BaseModel):
    RecordId:int
    AppoitmentId:int
    diagnosis:str
    treatment_plan:Optional[str]
    visit_notes:Optional[str]
    created_at:datetime
    model_config={"from_attributes":True}

# lab report
class LabReportCreate(BaseModel):
    AppointmentId:int
    test_name:str
    result:str
    normal_range:Optional[str]=None
    is_abnormal:bool=False
class LabReportUpdate(BaseModel):
    result:Optional[str]=None
    normal_range:Optional[str]=None
    is_abnormal:Optional[bool]=None

class LabReportResponse(BaseModel):
    LabReportId:int
    AppointmentId:int
    test_name:str
    result:str
    norml_range:Optional[str]
    is_abnormal:bool
    created_at:datetime

    model_config={"from_attributes":True}