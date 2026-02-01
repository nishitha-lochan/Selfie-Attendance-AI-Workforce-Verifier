# Selfie Attendance: AI-Powered Workplace Verifier (v3.0)

A sophisticated full-stack attendance system that integrates **Artificial Intelligence (Face Recognition & Liveness Detection)** and **Geospatial Analysis** to eliminate proxy attendance and ensure workplace integrity.

---

## 🏗️ Project Structure

The project is organized into `frontend` and `backend` directories for clear separation of concerns.

### 📂 Backend Structure
```text
backend/
├── app/
│   ├── api/          # API Route definitions
│   ├── core/         # Core configuration (DB, security)
│   ├── models/       # SQLAlchemy models
│   ├── utils/        # Face recognition, Liveness, Geo, and Auth utilities
│   └── main.py       # FastAPI application entry point
├── scripts/          # Maintenance scripts (DB reset, deletion, Liveness test)
├── uploads/          # Media storage (Attendance/Employee photos)
├── .env              # Environment-specific configuration
└── requirements.txt  # Python dependencies
```

### 📂 Frontend Structure
```text
frontend/
├── src/
│   ├── components/   # Reusable UI components (Camera, PrivateRoute)
│   ├── pages/        # Page-level components (Attendance, Dashboard)
│   ├── App.jsx       # Main application routing
│   └── main.jsx      # Entry point
└── ...               # Config files (vite, tailwind, etc.)
```

---

## 🧠 Core Implementation Modules

### 1. Artificial Intelligence (Face Recognition)
The system analyzes facial geometry to confirm identity.
- **Methodology**: Uses the `dlib` state-of-the-art face recognition model.
- **Feature Extraction**: When an employee registers, the system extracts **128 facial landmarks** (embeddings) and stores them as a vector.
- **Verification**: During check-in, the system matches the live selfie against the stored vector using **Euclidean Distance** (Strict tolerance: 0.45).

### 2. Anti-Spoofing (Liveness Detection)
To prevent photo-based fraud, the system issues **Random Challenges** before recognition.
- **Challenges**: "Blink twice", "Turn head LEFT/RIGHT", "Nod head UP/DOWN".
- **Algorithms**:
    - **Eye Aspect Ratio (EAR)**: High-speed analysis of eye landmarks (at 100ms intervals) to detect valid blinks.
    - **Nose Tip Tracking**: Real-time tracking of 3D-projected facial movement to verify head turns and nods.
- **Logic**: Verification is required and validated on the server before face matching proceeds.

### 3. Geospatial Logic (Geofencing)
- **Algorithm**: Implements the **Haversine Formula** to calculate the distance between the user and the office.
- **Validation**: Check-ins are only accepted if the user is within the office radius (e.g., 500 meters).

### 4. Attendance History & Analytics
- **Summary View**: Daily attendance status with map locations and check-in selfies.
- **Full History**: Employees can toggle the "View All History" mode to see their entire attendance log sorted by date and time (Newest First).

---

## 📊 Database Schema

- **Employees Table**: Stores basic profiles, hashed passwords (PBKDF2), and 128D face encodings.
- **Attendance Table**: Records `employee_id`, high-precision coordinates, timestamp, and local path to the verification selfie.

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js & npm
- MySQL/MariaDB

### 1. Configuration
Create a `.env` file in the `backend/` directory:
```bash
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_NAME=selfie_attendance
SECRET_KEY=your_secret_key
OFFICE_LAT=13.0129
OFFICE_LON=80.2231
GEOFENCE_RADIUS_KM=0.5
```

### 2. One-Click Quick Start
The project includes a unified starter script for Windows:
- `start_app.bat`: 
    1.  Kills any orphan backend/frontend processes.
    2.  Launches the FastAPI backend on port 8000.
    3.  Launches the Vite frontend on port 5173.
    4.  **Automatically opens the application in your default browser.**

---

## ✅ Technical Achievements 
*   **Real-time Liveness**: Integrated challenge-based anti-spoofing using facial landmark tracking.
*   **Burst Capture**: The camera component now handles sequence capture for movement analysis.
*   **Descending Audit Log**: Optimized database queries to show the most recent attendance records first.
*   **Enhanced Security**: Mandatory liveness verification before any attendance record is committed.

---

**Developed with ❤️ for Modern Workforce Management.**
