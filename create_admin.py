from app.database import SessionLocal
from app.models import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    try:
        # 1. Define Admin credentials
        admin_username = "admin"
        admin_password = "admin123"
        admin_email = "admin@hospital.com"

        # 2. Check if admin already exists
        admin_user = db.query(models.User).filter(models.User.username == admin_username).first()
        
        if admin_user:
            print("Admin user already exists.")
        else:
            # 3. Create the Admin user
            admin_user = models.User(
                username=admin_username,
                email=admin_email,
                FullName="Super Admin",  # Using your exact field name
                hashed_password=pwd_context.hash(admin_password),
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Admin user created!")

        # 4. Find or Create the "Admin" Role
        admin_role = db.query(models.Role).filter(models.Role.RoleName == "Admin").first()
        
        if not admin_role:
            admin_role = models.Role(RoleName="Admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("Admin role created!")
        
        # 5. Assign the role to the user (if not already assigned)
        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)
            db.commit()
            print("Admin role assigned to user!")

        print("\nSUCCESS! You can now log in with:")
        print(f"Username: {admin_username}")
        print(f"Password: {admin_password}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()