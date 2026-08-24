from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utility.deps import(get_current_user,get_db,require_role)

from app.models.models import (
    Invoice,
    InvoiceItem,
    Ward,
    Bed,
    WardAssignment,
    InvoiceStatus,
    InvoiceItemType,
)

from app.schemas.billing import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    WardCreate,
    WardResponse,
    BedCreate,
    BedResponse,
    WardAssignmentCreate,
    WardAssignmentResponse,
)

router = APIRouter(
    prefix="/billing",
    tags=["Billing"],
)

@router.post(
    "/invoices",
    response_model=InvoiceResponse,
)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "receptionist"]))
):

    invoice = Invoice(
        PatientId=payload.PatientId,
        AppointmentId=payload.AppointmentId,
        insurance_provider=payload.insurance_provider,
        status=InvoiceStatus.PENDING,
    )
    if payload.billing_date:
        invoice.billing_date = payload.billing_date

    db.add(invoice)
    db.flush()

    total = Decimal("0.00")

    for item in payload.items:

        subtotal = item.unit_price * item.quantity

        db_item = InvoiceItem(
            InvoiceId=invoice.InvoiceId,
            item_type=item.item_type,
            reference_id=item.reference_id,
            description=item.description,
            unit_price=item.unit_price,
            quantity=item.quantity,
            subtotal=subtotal,
        )

        db.add(db_item)
        total += subtotal

    invoice.total_amount = total

    db.commit()
    db.refresh(invoice)

    return invoice

# NEW: List all invoices (Admin / Receptionist)
@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "receptionist"])),
):
    return db.query(Invoice).order_by(Invoice.InvoiceId.desc()).all()

@router.get(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    invoice = (
        db.query(Invoice)
        .filter(Invoice.InvoiceId == invoice_id)
        .first()
    )

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return invoice

@router.patch("/invoices/{invoice_id}/status")
def update_invoice_status(
    invoice_id: int,
    status: InvoiceStatus,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "receptionist"]))
):

    invoice = (
        db.query(Invoice)
        .filter(Invoice.InvoiceId == invoice_id)
        .first()
    )

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice.status = status

    db.commit()

    return {
        "message": "Invoice status updated"
    }

@router.post(
    "/wards",
    response_model=WardResponse,
)
def create_ward(
    payload: WardCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):

    ward = Ward(
        name=payload.name,
        daily_rate=payload.daily_rate,
    )

    db.add(ward)
    db.commit()
    db.refresh(ward)

    return ward

@router.post(
    "/beds",
    response_model=BedResponse,
)
def create_bed(
    payload: BedCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"]))
):

    ward = (
        db.query(Ward)
        .filter(Ward.WardId == payload.WardId)
        .first()
    )

    if ward is None:
        raise HTTPException(
            status_code=404,
            detail="Ward not found",
        )

    bed = Bed(
        WardId=payload.WardId,
        bed_number=payload.bed_number,
    )

    db.add(bed)
    db.commit()
    db.refresh(bed)

    return bed

# -----------------------------
# Admit Patient to Ward
# -----------------------------
@router.post(
    "/ward-assignments",
    response_model=WardAssignmentResponse,
)
def admit_patient(
    payload: WardAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "receptionist", "doctor", "nurse"])),
):

    bed = (
        db.query(Bed)
        .filter(Bed.BedId == payload.BedId)
        .first()
    )

    if bed is None:
        raise HTTPException(
            status_code=404,
            detail="Bed not found",
        )

    if bed.is_occupied:
        raise HTTPException(
            status_code=400,
            detail="Bed is already occupied",
        )

    assignment = WardAssignment(
        PatientId=payload.PatientId,
        BedId=payload.BedId,
    )

    db.add(assignment)

    bed.is_occupied = True

    db.commit()
    db.refresh(assignment)

    return assignment


# -----------------------------
# Discharge Patient
# -----------------------------
@router.patch(
    "/ward-assignments/{assignment_id}/discharge",
    response_model=InvoiceResponse,
)
def discharge_patient(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin", "receptionist", "doctor", "nurse"])),
):

    assignment = (
        db.query(WardAssignment)
        .filter(
            WardAssignment.WardAssignmentId == assignment_id
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Ward assignment not found",
        )

    if assignment.discharged_at:
        raise HTTPException(
            status_code=400,
            detail="Patient already discharged",
        )

    discharge_time = datetime.utcnow()

    assignment.discharged_at = discharge_time

    bed = (
        db.query(Bed)
        .filter(Bed.BedId == assignment.BedId)
        .first()
    )

    if bed is None:
        raise HTTPException(
            status_code=404,
            detail="Bed not found",
        )

    bed.is_occupied = False

    ward = (
        db.query(Ward)
        .filter(Ward.WardId == bed.WardId)
        .first()
    )

    if ward is None:
        raise HTTPException(
            status_code=404,
            detail="Ward not found",
        )

    days = max(
        1,
        (discharge_time - assignment.admitted_at).days,
    )

    subtotal = ward.daily_rate * days

    invoice = Invoice(
        PatientId=assignment.PatientId,
        status=InvoiceStatus.PENDING,
        total_amount=subtotal,
    )

    db.add(invoice)
    db.flush()

    invoice_item = InvoiceItem(
        InvoiceId=invoice.InvoiceId,
        item_type=InvoiceItemType.WARD,
        reference_id=assignment.WardAssignmentId,
        description=f"Ward Stay ({ward.name}) - {days} day(s)",
        unit_price=ward.daily_rate,
        quantity=days,
        subtotal=subtotal,
    )

    db.add(invoice_item)

    db.commit()
    db.refresh(invoice)

    return invoice

@router.get("/wards", response_model=list[WardResponse])
def list_ward(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db.query(Ward).all()

@router.get("/wards/{ward_id}/beds", response_model=list[BedResponse])
def list_beds_in_ward(
    ward_id: int,
    db:Session =Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db.query(Bed).filter(
        Bed.WardId == ward_id
    ).all()

@router.get("/ward-assignments", response_model=list[WardAssignmentResponse])
def list_ward_assignment(
    active_only: bool=True,
    db:Session =Depends(get_db),
    current_user=Depends(get_current_user),
):
    query=db.query(WardAssignment)
    if active_only:
        query = query.filter(WardAssignment.discharged_at.is_(None))
    return query.all()

@router.get("/patients/{patient_id}/invoices", response_model=list[InvoiceResponse])
def get_patient_invoices(
    patient_id:int,
    db:Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db.query(Invoice).filter(Invoice.PatientId == patient_id).all()