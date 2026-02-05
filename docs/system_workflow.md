# Selfie Attendance: System Workflow

This document details the end-to-end process of how the Selfie Attendance system verifies a user and records their attendance.

## 🔄 End-to-End Process

The system follows a strict sequential verification process to ensure the person checking in is physically present, at the correct location, and is the authorized employee.

### 1. User Authentication
- **Action**: User logs into the mobile/web application using their credentials.
- **Verification**: The backend verifies the hashed password against the database records.

### 2. Geospatial Validation (Geofencing)
- **Trigger**: Before any camera action starts, the system requests the user's GPS coordinates.
- **Logic**: 
  - Uses the **Haversine Formula** to calculate the distance between the user's current coordinates and the predefined "Office Location".
  - **Success**: Access to camera/attendance marking is granted only if the user is within the allowed radius (e.g., 500 meters).
  - **Failure**: Attendance is blocked with an "Out of Range" notification.

### 3. Anti-Spoofing (Liveness Detection)
- **Goal**: Prevent the use of photos, videos, or masks.
- **Process**:
  - The system issues a **Random Challenge** (e.g., "Blink Twice", "Turn Head Left").
  - The camera captures a burst of frames or a video sequence.
  - **Analysis**:
    - **Blink Detection**: Analyzes the Eye Aspect Ratio (EAR) over time.
    - **Movement Tracking**: Tracks the 3D projection of the nose tip and facial landmarks to verify physical head movement.
- **Outcome**: The challenge must be successfully validated on the server before the system moves to identity verification.

### 4. Facial Identity Verification
- **Action**: Once liveness is confirmed, the system captures a clear selfie.
- **Logic**:
  - **Encoding**: Generates a **128D facial embedding** from the live photo.
  - **Matching**: Compares this embedding against the stored "Enrollment Photo" embedding using **Euclidean Distance**.
  - **Threshold**: A strict tolerance (typically 0.45 - 0.50) is applied. If the distance is below the threshold, identity is confirmed.

### 5. Attendance Recording
- **Final Step**: If all previous steps pass, the backend:
  1. Saves the verification selfie to `uploads/attendance/`.
  2. Creates a record in the `Attendance` table with:
     - Employee ID
     - Timestamp
     - Location (Lat/Lon)
     - Selfie Path
  3. Returns a success message to the frontend.

---

## 🛠️ Error Handling & UI Feedback

| Stage | Possible Failure | System Response |
| :--- | :--- | :--- |
| **Geo Check** | Geolocation Disabled | Prompt user to enable GPS |
| **Geo Check** | Distance > Radius | Show "Out of Office Geofence" |
| **Liveness** | No movement detected | "Liveness Check Failed - Try Again" |
| **Identity** | Face mismatch | "Identity Verification Failed" |
