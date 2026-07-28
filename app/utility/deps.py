from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.utility.auth import decode_token
from app.database import SessionLocal
from app.models.models import User

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db =SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(
        User.UserId == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user
# helper:get role names as a set
def _roles(user)-> set:
    return {r.RoleName for r in user.roles}
# layer-1:admin
def require_admin(current_user=Depends(get_current_user)):
    roles=[r.RoleName for r in current_user.roles]
    if "admin" not in roles and not current_user.is_superuser:
        raise HTTPException(status_code=403,detail="Admin access required")
    return current_user
# layer-2:management
def require_management(current_user=Depends(get_current_user)):
    allowed={"admin","management"}
    if not current_user.is_superuser and not (_roles(current_user)&allowed):
        raise HTTPException(status_code=403,detail="management access required")
    return current_user
# layer -3 Operational roles
def require_doctor(current_user=Depends(get_current_user)):
    roles =[r.RoleName for r in current_user.roles]
    if "doctor" not in roles and not current_user.is_superuser:
        raise HTTPException(status_code=403,detail="Doctor access required")
    return current_user
def require_nurse(current_user=Depends(get_current_user)):
    allowed={"admin","management","nurse"}
    if not current_user.is_superuser and not (_roles(current_user)& allowed):
        raise HTTPException(status_code=403,detail="Nurse access required")
    return current_user

def require_pharmacist(current_user=Depends(get_current_user)):
    allowed={"admin","management","pharmacist"}
    if not current_user.is_superuser and not (_roles(current_user)&allowed):
        raise HTTPException(status_code=403,detail="Pharmacist access required")
    return current_user
def require_lab_tech(current_user=Depends(get_current_user)):
    allowed={"admin","management","lab_technician"}
    if not current_user.is_superuser and not (_roles(current_user)&allowed):
        raise HTTPException(status_code=403,detail="Lab technician access required")
    return current_user
def require_patient(current_user=Depends(get_current_user)):
    allowed={"admin","management","patient"}
    if not current_user.is_superuser and not (_roles(current_user)&allowed):
        raise HTTPException(status_code=403,detail="patient access required")
    return current_user


def require_role(role_names: list[str]):
    def checker(current_user=Depends(get_current_user)):

        if current_user.is_superuser:
            return current_user

        user_roles = _roles(current_user)

        if not user_roles.intersection(role_names):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )

        return current_user

    return checker