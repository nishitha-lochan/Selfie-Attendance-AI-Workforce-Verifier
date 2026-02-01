from app.core.database import engine, Base, SessionLocal
from app.models.models import Employee, UserRole
from app.utils.auth import get_password_hash
import pickle
import numpy as np

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed Initial HR User
    print("Seeding Initial HR User...")
    db = SessionLocal()
    
    # Create a dummy face encoding for the admin (so we don't crash on face checks if any)
    # Just a zero array
    dummy_encoding = np.zeros(128)
    encoding_blob = pickle.dumps(dummy_encoding)
    
    hr_user = Employee(
        id=1,
        name="Admin HR",
        # email removed
        designation="Human Resources",
        hashed_password=get_password_hash("admin"),
        role=UserRole.HR,
        face_encoding=encoding_blob,
        photo_path="" 
    )
    
    db.add(hr_user)
    db.commit()
    print("Database reset complete. HR User created. ID: 1, Password: admin")
    db.close()

if __name__ == "__main__":
    reset_database()
