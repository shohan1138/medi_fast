from datetime import date, timedelta
from calendar import monthrange
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.utility.deps import get_db, get_current_user
from app.models import models

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def require_report_access(current_user: models.User = Depends(get_current_user)):
    if current_user.is_superuser:
        return current_user
    user_roles = [role.RoleName for role in current_user.roles]
    if "admin" not in user_roles and "management" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access reports"
        )
    return current_user


def _month_range(year: Optional[int], month: Optional[int]):
    today = date.today()
    y = year or today.year
    m = month or today.month
    if not (1 <= m <= 12):
        raise HTTPException(status_code=400, detail="month must be between 1 and 12")
    start = date(y, m, 1)
    last_day = monthrange(y, m)[1]
    end = date(y, m, last_day) + timedelta(days=1)  # exclusive upper bound
    return start, end


@router.get("/summary")
def get_reports_summary(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_report_access),
):
    start, end = _month_range(year, month)
    query = text("""
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COUNT("InvoiceId") AS invoice_count
        FROM invoices
        WHERE billing_date >= :start_date AND billing_date < :end_date;
    """)
    row = db.execute(query, {"start_date": start, "end_date": end}).fetchone()
    return {
        "period_start": start.isoformat(),
        "period_end": (end - timedelta(days=1)).isoformat(),
        "total_revenue": float(row.total_revenue),
        "invoice_count": row.invoice_count,
    }


@router.get("/revenue-by-ward")
def get_revenue_by_ward(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_report_access),
):
    start, end = _month_range(year, month)
    query = text("""
        SELECT
            w.name AS ward_name,
            COALESCE(SUM(ii.subtotal), 0) AS total_revenue,
            COUNT(DISTINCT i."InvoiceId") AS invoice_count
        FROM wards w
        LEFT JOIN beds b ON w."WardId" = b."WardId"
        LEFT JOIN ward_assignments wa ON b."BedId" = wa."BedId"
        LEFT JOIN invoice_items ii
            ON ii.reference_id = wa."WardAssignmentId" AND ii.item_type = 'ward'
        LEFT JOIN invoices i
            ON ii."InvoiceId" = i."InvoiceId"
            AND i.billing_date >= :start_date AND i.billing_date < :end_date
        GROUP BY w.name
        ORDER BY total_revenue DESC;
    """)
    result = db.execute(query, {"start_date": start, "end_date": end}).fetchall()
    return [
        {"ward_name": row.ward_name, "total_revenue": float(row.total_revenue), "invoice_count": row.invoice_count}
        for row in result
    ]


@router.get("/doctor-appointment-load")
def get_doctor_appointment_load(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_report_access),
):
    start, end = _month_range(year, month)
    query = text("""
        SELECT
            d."DoctorId" AS doctor_id,
            u."FullName" AS doctor_name,
            d.specialty,
            COUNT(a."AppointmentId") AS total_appointments
        FROM doctors d
        JOIN users u ON d."UserId" = u."UserId"
        LEFT JOIN appointments a
            ON d."DoctorId" = a."DoctorId"
            AND a.appointment_date >= :start_date AND a.appointment_date < :end_date
        GROUP BY d."DoctorId", u."FullName", d.specialty
        ORDER BY total_appointments DESC;
    """)
    result = db.execute(query, {"start_date": start, "end_date": end}).fetchall()
    return [
        {"doctor_name": row.doctor_name, "specialty": row.specialty, "total_appointments": row.total_appointments}
        for row in result
    ]


@router.get("/revenue-by-service-type")
def get_revenue_by_service_type(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_report_access),
):
    start, end = _month_range(year, month)
    query = text("""
        SELECT
            ii.item_type,
            SUM(ii.subtotal) AS total_revenue,
            COUNT(ii."InvoiceItemId") AS total_items_billed
        FROM invoice_items ii
        JOIN invoices i ON ii."InvoiceId" = i."InvoiceId"
        WHERE i.billing_date >= :start_date AND i.billing_date < :end_date
        GROUP BY ii.item_type
        ORDER BY total_revenue DESC;
    """)
    result = db.execute(query, {"start_date": start, "end_date": end}).fetchall()
    return [
        {"item_type": row.item_type, "total_revenue": float(row.total_revenue), "total_items_billed": row.total_items_billed}
        for row in result
    ]