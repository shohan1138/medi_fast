from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum

class InvoiceStautus(str,Enum):
    pending="pending"
    paid="paid"
    rejected="rejected"

class InvoiceCreate(BaseModel):
    AppointmentId:int
    total_amout:Decimal
    insurance_provider:Optional[str]=None
    status:InvoiceStautus=InvoiceStautus.pending

class InvoiceUpdate(BaseModel):
    total_amount:Optional[Decimal]=None
    status:Optional[InvoiceStautus]=None
    insurance_provider:Optional[str]=None

class InvoiceResponse(BaseModel):
    InvoiceId:int
    Appoitment:int
    total_amount:Decimal
    status:str
    insurance_provider:Optional[str]
    billing_date:datetime

    model_config={"from_attributes":True}