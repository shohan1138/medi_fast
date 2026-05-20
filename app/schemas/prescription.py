from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum

class PrescriptionStatus(str,Enum):
    active="active"
    dispensed="dispensed"
    cancelled ="cancelled"

# medicine

class MedicineCreate(BaseModel):
    name:str
    category:str
    stock_quantity:int
    price:Decimal

class MedicalUpdate(BaseModel):
    name:Optional[str]=None
    category:Optional[str]=None
    stock_quantity:Optional[int]=None
    price:Optional[Decimal]=None

class MedicineResponse(BaseModel):
    MedicineId:int
    name:str
    category:str
    stock_quantity:int
    price:Decimal

    model_config={"from_attributes":True}

# prescription item

class PrescriptionItemCreate(BaseModel):
    MedicineId:int
    dosage:str
    frequency:str
    duration:str

class PresciptionItemResponse(BaseModel):
    PreiptiptionItemId:int
    PrecriptionId:int
    MedicineId:int
    dosage:str
    frequency:str
    duration:str
    model_config={"from_attributes":True}

# prescription

class PrescriptionCreate(BaseModel):
    Appointment:int
    stauts:PrescriptionStatus=PrescriptionStatus.active
    items:list[PrescriptionItemCreate]=[]

class PrescripUpdate(BaseModel):
    status:Optional[PrescriptionStatus]=None

class PrescriptionResponse(BaseModel):
    PrescriptionId:int
    AppointmentId:int
    issued_at:datetime
    status:str
    items:list[PresciptionItemResponse]=[]

    model_config={"from_attributes":True}