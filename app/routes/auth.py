from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from app.utility.deps import get_current_user,get_db,require_admin
from app.utility.auth import hash_password,verify_password,create_access_token
from app.schemas.user import UserCreate,UserResponse,LoginRequest,TokenResponse,RoleCreate,RoleResponse
from app.models import models

router=APIRouter(prefix="/auth",tags=["Auth"])

@router.post("/register", response_model=UserResponse,status_code=201)
def register(data:UserCreate,db:Session=Depends(get_db)):

    if db.query(models.User).filter(models.User.email==data.email).first():
        raise HTTPException(status_code=400,detail="Email already registered")
    if db. query(models.User).filter(models.User.username==data.username).first():
        raise HTTPException(status_code=400,detail="Username already taken")
    
    role=db.query(models.Role).filter(
        models.Role.RoleName==data.role
    ).first()

    if not role:
        raise HTTPException(status_code=500,detail="Role 'patient'not found in DB. Ask admin to call /auth/seed-roles first.")
    
    user=models.User(
        username=data.username,
        FullName=data.FullName,
        email=data.email,
        hashed_password=hash_password(data.password),
        phone_number=data.phone_number,
    )
    user.roles.append(role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login",response_model=TokenResponse)
def login(date:LoginRequest,db: Session=Depends(get_db)):
    user = db.query(models.User).filter(models.User.username==date.username).first()
    if not user or not verify_password(date.password,user.hashed_password):
        raise HTTPException(status_code=401,detail="Invalid username or password")
    token= create_access_token({"sub":str(user.UserId)})
    return {"access_token": token,"token_type":"bearer"}

@router.get("/me",response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    return current_user

@router.post("/seed-roles",status_code=201,dependencies=[Depends(require_admin)])
def seed_roles(db:Session=Depends(get_db)):
    all_roles=[
        "admin","managment","doctor","nurse","pharmacist","lab_technician","patient"
    ]
    created=[]
    for name in all_roles:
        exists=db.query(models.Role).filter(
            models.Role.RoleName==name
        ).first()
        if not exists:
            db.add(models.Role(RoleName=name))
            created.append(name)
            db.commit
            return{"msg":"Roles seeded","created":created}
    # for name in ["admin","doctor","patient"]:
    #     exists=db.query(models.Role).filter(models.Role.RoleName==name).first()
    #     if not exists:
    #         db.add(models.Role(RoleName=name))
    # db.commit()
    # return{"msg":"Roles created:admin.doctor,patient"}
# admin only create new role
@router.post("/roles",response_model=RoleResponse, status_code=201,
            dependencies=[Depends(require_admin)])
def create_role(data:RoleCreate,db:Session=Depends(get_db)):
    exists = db.query(models.Role).filter(
        models.Role.RoleName==data.RoleName).first()
    if exists:
        raise HTTPException(status_code=400,detail=f"Role'{data.RoleName}'already exists")
    role=models.Role(RoleName=data.RoleName)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

# admin only list all roles
@router.get("/roles",response_model=list[RoleResponse],
            dependencies=[Depends(require_admin)])
def list_roles(db:Session=Depends(get_db)):
    return db.query(models.Role).all()

# admin only delete a role
@router.delete("/roles/{role_name}",status_code=200,dependencies=[Depends(require_admin)])
def delete_role(role_name:str,db:Session=Depends(get_db)):
    role= db.query(models.Role).filter(
        models.Role.RoleName==role_name).first()
    if not role:
        raise HTTPException(status_code=404,detail=f"Role'{role_name}'not found")
    db.delete(role)
    db.commit()
    return{"msg":f"Role'{role_name}'deleted"}

# createing supperuser for once then delete following parts:

# @router.post("/create-superuser",status_code=201)
# def create_speruser(data:UserCreate,db:Session=Depends(get_db)):
#     if db.query(models.User).filter(models.User.email==data.email).first():
#         raise HTTPException(status_code=400,detail="email already registered")
#     role=db.query(models.Role).filter(
#         models.Role.RoleName=="admin"
#     ).first()
#     user=models.User(
#         username=data.username,
#         FullName=data.FullName,
#         email=data.email,
#         hashed_password=hash_password(data.password),
#         phone_number=data.phone_number,
#         is_superuser=True,
#         is_active=True,
#     )
#     if role:
#         user.roles.append(role)
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user


@router.post("/users/{user_id}/roles/{role_name}",response_model=UserResponse)
def assign_role(
    user_id:str,
    role_name:str,
    db:Session=Depends(get_db),
    current_user=Depends(get_current_user)
):
    user_roles={r.RoleName for r in current_user.roles}

    # each layer can assign role
    admin_only_roles={"admin","managment"}
    managment_only_roles={"doctor","nurse","pharmacist","lab_technician","patient"}

    is_admin =current_user.is_superuser or "admin" in user_roles
    is_managment="managment"in user_roles
    if role_name in admin_only_roles and not is_admin:
        raise HTTPException(status_code=403,detail=f"Only admin can assign '{role_name}'role")
    if role_name in management_roles and not (is_admin or is_management):
        raise HTTPException(status_code=403, detail="Management or Admin access required")

    user = db.query(models.User).filter(models.User.UserId == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(models.Role).filter(models.Role.RoleName == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found")

    if role not in user.roles:
        user.roles.append(role)
        db.commit()
        db.refresh(user)

    return user