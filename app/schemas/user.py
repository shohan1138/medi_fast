from pydantic import BaseModel,EmailStr
from typing import Optional #, Literal
from datetime import datetime

#Role
class RoleCreate(BaseModel):
    RoleName:str

class RoleResponse(BaseModel):
    RoleId:int
    RoleName:str
    model_config={"from_attributes":True}

#user
class UserCreate(BaseModel):
    username:str
    FullName:str
    email:EmailStr
    password:str
    phone_number:str
    # role:Literal["patient"]="patient"

class UserUpdate(BaseModel):
    FullName:Optional[str] = None
    email:Optional[EmailStr] = None
    phone_number:Optional[str] = None
    is_active:Optional[bool] = None

class UserResponse(BaseModel):
    UserId:int
    username:str
    FullName:str
    email:str
    phone_number:str
    is_active:bool
    is_superuser:bool
    created_at:datetime
    roles:list[RoleResponse] =[]
    model_config={"from_attributes":True}

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
# Login
class LoginRequest(BaseModel):
    username:str
    password:str

class TokenResponse(BaseModel):
    access_token:str
    token_type:str = "bearer"