from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum

class prescriptionStatus(str,Enum):
    active="active"
    dispensed="dispensed"
    cancelled ="cancelled"

# # medicine

# class MedicineCreate(BaseModel):
#     name:str
#     category:str
#     stock_quantity:int
#     price:Decimal

# class MedicalUpdate(BaseModel):
#     name:Optional[str]=None
#     category:Optional[str]=None
#     stock_quantity:Optional[int]=None
#     price:Optional[Decimal]=None

# class MedicineResponse(BaseModel):
#     MedicineId:int
#     name:str
#     category:str
#     stock_quantity:int
#     price:Decimal

#     model_config={"from_attributes":True}

# prescription item

class prescriptionItemCreate(BaseModel):
    medicine_name: str 
    dosage:str               #e.g. "500mg"
    frequency:str             #e.g. "twice daily"
    duration:str              #e.g. "7 days"

class prescriptionItemUpdate(BaseModel):
    dosage: Optional[str]=None
    frequency: Optional[str]=None
    duration:Optional[str]=None

class prescriptionItemResponse(BaseModel):
    PrescriptionItemId:int
    PrescriptionId:int
    medicine_name: str
    dosage:str
    frequency:str
    duration:str
    
    model_config={"from_attributes":True}

# prescription

class prescriptionCreate(BaseModel):
    AppointmentId:int
    status:prescriptionStatus=prescriptionStatus.active
    items:list[prescriptionItemCreate]=[]

class prescriptionStatusUpdate(BaseModel):
    status:Optional[prescriptionStatus]=None

class prescriptionResponse(BaseModel):
    prescriptionId:int
    AppointmentId:int
    issued_at:datetime
    status:str
    items:list[prescriptionItemResponse]=[]

    model_config={"from_attributes":True}