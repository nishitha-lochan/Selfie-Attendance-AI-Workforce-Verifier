from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt
from app.core.database import get_db
from app.models.models import Employee, Attendance, AttendanceStatus, UserRole
from app.utils.face_utils import get_face_encoding, verify_face
from app.utils.geo_utils import is_within_radius
from app.utils.auth import verify_password, create_access_token, get_password_hash, SECRET_KEY, ALGORITHM
from app.utils.liveness_utils import get_challenge, verify_liveness
import datetime
import pickle
import base64
import uuid
import os
from pydantic import BaseModel

router = APIRouter()

# Configuration
from decouple import config

# Configuration from environment variables
OFFICE_LAT = config("OFFICE_LAT", default=13.0129, cast=float)
OFFICE_LON = config("OFFICE_LON", default=80.2231, cast=float)
GEOFENCE_RADIUS_KM = config("GEOFENCE_RADIUS_KM", default=0.5, cast=float) 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

class LoginRequest(BaseModel):
    employee_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    employee_id: int
    name: str

class AttendanceRequest(BaseModel):
    image_base64: str
    latitude: float
    longitude: float
    # employee_id is derived from token
    frames_base64: list[str] = []
    challenge_id: str = None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_id: str = payload.get("sub")
        if emp_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(Employee).filter(Employee.id == emp_id).first()
    if user is None:
        raise credentials_exception
    return user

from fastapi import Request

@router.post("/token")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        emp_id_raw = body.get("employee_id")
        password = body.get("password")
        
        if not emp_id_raw or not password:
            raise HTTPException(status_code=400, detail="Missing Employee ID or Password")
            
        try:
            e_id = int(emp_id_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail="Employee ID must be a number")
            
        user = db.query(Employee).filter(Employee.id == e_id).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect Employee ID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "role": user.role,
            "employee_id": user.id,
            "name": user.name
        }
    except Exception as e:
        print(f"DEBUG: Global login error: {type(e).__name__}: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/liveness/challenge")
async def get_liveness_challenge(current_user: Employee = Depends(get_current_user)):
    """Provides a random liveness challenge for the user to complete."""
    return get_challenge()

@router.post("/register")
async def register_employee(
    name: str = Form(...),
    password: str = Form(...),
    designation: str = Form(...),
    file: UploadFile = File(...),
    is_hr: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Only HR can register
    if current_user.role != UserRole.HR:
        raise HTTPException(status_code=403, detail="Only HR can register employees")
    # Read image
    image_bytes = await file.read()
    
    # Get encoding
    encoding, error = get_face_encoding(image_bytes)
    if encoding is None:
        raise HTTPException(status_code=400, detail=f"Registration failed: {error}")
    
    # Serialize encoding
    encoding_blob = pickle.dumps(encoding)
    
    # Save image
    os.makedirs("uploads/employees", exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    filepath = f"uploads/employees/{filename}"
    with open(filepath, "wb") as f:
        f.write(image_bytes)
        
    new_employee = Employee(
        name=name,
        # email removed
        hashed_password=get_password_hash(password),
        role=UserRole.HR if is_hr else UserRole.EMPLOYEE,
        designation=designation,
        face_encoding=encoding_blob,
        photo_path=filepath
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return {"id": new_employee.id, "name": new_employee.name, "message": "Result: Success. Your Employee ID is " + str(new_employee.id)}

@router.post("/mark-attendance")
async def mark_attendance(
    request: AttendanceRequest, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # 1. Check Geofence
    within_radius, distance = is_within_radius(request.latitude, request.longitude, OFFICE_LAT, OFFICE_LON, GEOFENCE_RADIUS_KM)
    
    if not within_radius:
        raise HTTPException(
            status_code=400, 
            detail=f"You are outside the office geofence! (Distance: {distance:.2f}km)"
        )

    # 1.5 Liveness Verification
    if request.challenge_id and request.frames_base64:
        is_live, liveness_msg = verify_liveness(request.frames_base64, request.challenge_id)
        if not is_live:
            raise HTTPException(status_code=400, detail=liveness_msg)
    else:
        raise HTTPException(status_code=400, detail="Liveness verification (challenge_id and frames) is required")

    status_val = AttendanceStatus.PRESENT
    rejection_reason = None
        
    # 2. Decode Image
    try:
        if "," in request.image_base64:
            header, encoded = request.image_base64.split(",", 1)
        else:
            encoded = request.image_base64
        image_bytes = base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")
        
    # 3. Verify Face
    current_encoding, error = get_face_encoding(image_bytes)
    if current_encoding is None:
        raise HTTPException(status_code=400, detail=f"Face validation failed: {error}")
        
    # Match
    is_match, distance = verify_face(current_user.face_encoding, current_encoding)
    if not is_match:
         raise HTTPException(
             status_code=401, 
             detail=f"Face mismatch. Attendance rejected. (Dist: {distance:.2f} > 0.45)"
         )
         
    # 4. Check Duplicate
    today = datetime.date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        func.date(Attendance.timestamp) == today
    ).first()
    
    if existing:
        return {"message": "Attendance already marked for today", "status": existing.status}
        
    # Save Selfie
    os.makedirs("uploads/attendance", exist_ok=True)
    filename = f"{uuid.uuid4()}.jpg"
    filepath = f"uploads/attendance/{filename}"
    with open(filepath, "wb") as f:
        f.write(image_bytes)
        
    # 5. Record
    attendance = Attendance(
        employee_id=current_user.id,
        latitude=request.latitude,
        longitude=request.longitude,
        selfie_path=filepath,
        status=status_val,
        rejection_reason=rejection_reason
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return {"message": "Attendance Marked Successfully", "status": "PRESENT"}

@router.get("/attendance")
async def get_attendance(
    date: str = None, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Attendance)
    
    # RBAC: If not HR, only see own records
    if current_user.role != UserRole.HR:
        query = query.filter(Attendance.employee_id == current_user.id)
        
    if date:
        try:
             query_date = datetime.datetime.strptime(date, '%Y-%m-%d').date()
             query = query.filter(func.date(Attendance.timestamp) == query_date)
        except ValueError:
            pass 
            
    records = query.order_by(Attendance.timestamp.desc()).all()
    
    results = []
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": emp.name if emp else "Unknown",
            "time": r.timestamp,
            "status": r.status,
            "location": f"{r.latitude}, {r.longitude}",
            "rejection_reason": r.rejection_reason,
            "selfie_url": f"/static/attendance/{os.path.basename(r.selfie_path)}" if r.selfie_path else None
        })
    return results

@router.get("/employees")
async def get_employees(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    # Only authenticated users
    emps = db.query(Employee).all()
    # Filter out face_encoding/password
    return [{"id": e.id, "name": e.name, "designation": e.designation, "role": e.role} for e in emps]

@router.delete("/attendance/{id}")
async def delete_attendance(id: int, db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    record = db.query(Attendance).filter(Attendance.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    # Check permission: HR can delete anything, Employee only their own
    if current_user.role != UserRole.HR and record.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
        
    db.delete(record)
    db.commit()
    return {"message": "Attendance record deleted successfully"}
