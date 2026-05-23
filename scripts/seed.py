import sys
import os

sys.path.insert(0,os.path.abspath(os.path.join(os.path.dirname(__file__),'..')))
from app.database import SessionLocal
from app.models.models import Role,User
from app.utility.auth import hash_password

db=SessionLocal()

# @router.post("/seed-roles",status_code=201,dependencies=[Depends(require_admin)])
def seed_roles():
    all_roles=[
        "admin","managment","doctor","nurse","pharmacist","lab_technician","patient"
    ]
    created=[]
    for name in all_roles:
        exists=db.query(Role).filter(
            Role.RoleName==name
        ).first()
        if not exists:
            db.add(Role(RoleName=name))
            created.append(name)
        db.commit
        print(f"[seed_roles] created:{created if created else '(already exist)'}")

            # return{"msg":"Roles seeded","created":created}
    # for name in ["admin","doctor","patient"]:
    #     exists=db.query(models.Role).filter(models.Role.RoleName==name).first()
    #     if not exists:
    #         db.add(models.Role(RoleName=name))
    # db.commit()
    # return{"msg":"Roles created:admin.doctor,patient"}

def seed_superuser():
    username="admin"
    email="admin@hospital.com"

    if db.query(User).filter(User.username==username).first():
        print(f"[seed_superuser]'{username}' already exists,skipping")
        return
    admin_role=db.query(Role).filter(Role.RoleName=="admin").first()
    if not admin_role:
        print("[seed_superuser] 'admin' role not found> run seed_roles first")
        return
    
    user=User(
         username=username,
        FullName="System Admin",
        email=email,
        hashed_password=hash_password("admin123"),
        phone_number="+8801700000000",
        is_superuser=True,
        is_active=True,
    )
    if admin_role:
        user.roles.append(admin_role)
    db.add(user)
    db.commit()
    print(f"[seed_superuser] created superuser '{username}' with password 'admin123'")
    print("[seed_superuser] created — login then call PATCH /auth/change-password immediately")

if __name__ == "__main__":
    seed_roles()
    seed_superuser()
    db.close()

