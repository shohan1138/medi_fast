from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

from app.models.models import InvoiceStatus, InvoiceItemType


# ---------------- Invoice Items ----------------

class InvoiceItemCreate(BaseModel):
    item_type: InvoiceItemType
    reference_id: Optional[int] = None
    description: str
    unit_price: Decimal
    quantity: Decimal = Decimal("1")


class InvoiceItemResponse(InvoiceItemCreate):
    InvoiceItemId: int
    subtotal: Decimal

    model_config = {
        "from_attributes": True
    }


# ---------------- Invoice ----------------

class InvoiceCreate(BaseModel):
    PatientId: int
    AppointmentId: Optional[int] = None
    insurance_provider: Optional[str] = None
    billing_date: Optional[date] =None
    items: list[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    insurance_provider: Optional[str] = None


class InvoiceResponse(BaseModel):
    InvoiceId: int
    PatientId: int
    AppointmentId: Optional[int]

    total_amount: Decimal
    status: InvoiceStatus

    created_at: datetime
    insurance_provider: Optional[str]
    billing_date: date

    items: list[InvoiceItemResponse] = []

    model_config = {
        "from_attributes": True
    }




# ---------------- Ward ----------------

class WardCreate(BaseModel):
    name: str
    daily_rate: Decimal


class WardResponse(WardCreate):
    WardId: int

    model_config = {
        "from_attributes": True
    }


# ---------------- Bed ----------------

class BedCreate(BaseModel):
    WardId: int
    bed_number: str


class BedResponse(BaseModel):
    BedId: int
    WardId: int

    bed_number: str
    is_occupied: bool

    model_config = {
        "from_attributes": True
    }


# ---------------- Ward Assignment ----------------

class WardAssignmentCreate(BaseModel):
    PatientId: int
    BedId: int


class WardAssignmentResponse(BaseModel):
    WardAssignmentId: int
    PatientId: int
    BedId: int

    admitted_at: datetime
    discharged_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }