from sqlalchemy import Column, Integer, String, DateTime, Float, LargeBinary, Enum as SqlEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    REJECTED = "REJECTED"

class UserRole(str, enum.Enum):
    HR = "HR"
    EMPLOYEE = "EMPLOYEE"

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # email = Column(String(100), unique=True, index=True, nullable=False) # Removed
    hashed_password = Column(String(255), nullable=False)
    role = Column(SqlEnum(UserRole), default=UserRole.EMPLOYEE)
    designation = Column(String(100))
    # Storing face encoding as generic JSON string or BLOB
    # face_recognition encodings are numpy arrays (128 floats). 
    # Valid options: Pickle (BLOB) or JSON list. Using Pickle for simplicity in Python.
    face_encoding = Column(LargeBinary, nullable=False) 
    photo_path = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    selfie_path = Column(String(255))
    status = Column(SqlEnum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    rejection_reason = Column(String(255), nullable=True)
