from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import models
# Import your get_current_user function (adjust the import path if it's somewhere else)
from app.routes.auth import get_current_user 

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

# 1. Create a custom dependency that checks for Admin or Management roles
def require_report_access(current_user: models.User = Depends(get_current_user)):
    # Allow Super Admins automatically
    if current_user.is_superuser:
        return current_user
    
    # Check if the user has the "admin" or "management" role
    user_roles = [role.RoleName for role in current_user.roles]
    if "admin" not in user_roles and "management" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access reports"
        )
    return current_user


# 2. Add the dependency to your endpoints
@router.get("/revenue-by-ward")
def get_revenue_by_ward(db: Session = Depends(get_db), current_user: models.User = Depends(require_report_access)):
    query = text("""
        SELECT 
            w.name AS ward_name, 
            COALESCE(SUM(i.total_amount), 0) AS total_revenue,
            COUNT(i."InvoiceId") AS invoice_count
        FROM wards w
        LEFT JOIN beds b ON w."WardId" = b."WardId"
        LEFT JOIN ward_assignments wa ON b."BedId" = wa."BedId"
        LEFT JOIN invoices i ON wa."PatientId" = i."PatientId" 
            AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY w.name
        ORDER BY total_revenue DESC;
    """)
    result = db.execute(query).fetchall()
    return [
        {
            "ward_name": row.ward_name,
            "total_revenue": float(row.total_revenue),
            "invoice_count": row.invoice_count
        } for row in result
    ]

@router.get("/doctor-appointment-load")
def get_doctor_appointment_load(db: Session = Depends(get_db), current_user: models.User = Depends(require_report_access)):
    query = text("""
        SELECT 
            u."FullName" AS doctor_name,
            d.specialty,
            COUNT(a."AppointmentId") AS total_appointments
        FROM doctors d
        JOIN users u ON d."UserId" = u."UserId"
        LEFT JOIN appointments a ON d."DoctorId" = a."DoctorId"
        GROUP BY u."FullName", d.specialty
        ORDER BY total_appointments DESC;
    """)
    result = db.execute(query).fetchall()
    return [
        {
            "doctor_name": row.doctor_name,
            "specialty": row.specialty,
            "total_appointments": row.total_appointments
        } for row in result
    ]

@router.get("/revenue-by-service-type")
def get_revenue_by_service_type(db: Session = Depends(get_db), current_user: models.User = Depends(require_report_access)):
    query = text("""
        SELECT 
            ii.item_type,
            SUM(ii.subtotal) AS total_revenue,
            COUNT(ii."InvoiceItemId") AS total_items_billed
        FROM invoice_items ii
        JOIN invoices i ON ii."InvoiceId" = i."InvoiceId"
        GROUP BY ii.item_type
        ORDER BY total_revenue DESC;
    """)
    result = db.execute(query).fetchall()
    return [
        {
            "item_type": row.item_type,
            "total_revenue": float(row.total_revenue),
            "total_items_billed": row.total_items_billed
        } for row in result
    ]