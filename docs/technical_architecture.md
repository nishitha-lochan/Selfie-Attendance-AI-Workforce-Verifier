# Selfie Attendance: Technical Architecture

This document provides a deep dive into the technology stack, core algorithms, and data architecture of the Selfie Attendance system.

## 💻 Technology Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (Vite-based)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for responsive and modern UI.
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Client**: [Axios](https://axios-http.com/) for backend communication.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database**: MySQL / MariaDB
- **Security**: 
  - JWT (JSON Web Tokens) for session management.
  - PBKDF2 with SHA-256 for password hashing.

### AI & Computer Vision
- **Library**: [OpenCV](https://opencv.org/) for image processing and camera handling.
- **Model**: [dlib](http://dlib.net/) state-of-the-art face recognition (ResNet-style model).
- **Landmark Detection**: 68-point facial landmark predictor.

---

## 🧠 Core Logic & Algorithms

### 1. Face Recognition (Embeddings)
The system does not compare raw images. Instead, it converts faces into mathematical representations.
- **Algorithm**: Deep Metric Learning using a Residual Network (ResNet).
- **Output**: A **128-dimensional vector** (embedding) where similar faces are numerically close together.
- **Matching**: Calculated using **Euclidean Distance**.
  - Formula: $d(p, q) = \sqrt{\sum_{i=1}^{n} (p_i - q_i)^2}$
  - A distance $< 0.5$ generally indicates the same person.

### 2. Liveness Detection (EAR)
To prevent photo spoofing, the system monitors eye movement.
- **Eye Aspect Ratio (EAR)**: Calculated from 6 landmarks around each eye.
- **Formula**: $EAR = \frac{||p_2 - p_6|| + ||p_3 - p_5||}{2||p_1 - p_4||}$
- **Blink Logic**: A sudden drop and recovery in EAR (falling below a threshold of ~0.2) signifies a valid physical blink.

### 3. Head Pose Estimation
Verifies that the user is turning their head as requested.
- **Method**: Tracks the distance and orientation of the **Nose Tip** relative to the eye centers.
- **Logic**: If the horizontal offset of the nose tip exceeds a threshold to the left or right, a "Head Turn" is validated.

### 4. Geofencing (Haversine Formula)
Calculates the great-circle distance between two points on a sphere (the Earth).
- **Formula**:
  $a = \sin^2(\Delta\phi/2) + \cos \phi_1 \cdot \cos \phi_2 \cdot \sin^2(\Delta\lambda/2)$
  $c = 2 \cdot \operatorname{atan2}(\sqrt{a}, \sqrt{1-a})$
  $d = R \cdot c$
- **Usage**: Compares user's live GPS against fixed office coordinates to ensure physical presence at the workplace.

---

## 🗄️ Database Architecture

### Employees Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INT (PK) | Unique employee identifier |
| `name` | VARCHAR | Full name |
| `email` | VARCHAR (Unique)| Login credential |
| `password` | VARCHAR | Hashed password |
| `face_encoding` | BLOB/TEXT | Compressed 128D vector |

### Attendance Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INT (PK) | Record ID |
| `employee_id` | INT (FK) | Reference to Employee |
| `timestamp` | DATETIME | Time of check-in |
| `latitude` | FLOAT | GPS Latitude |
| `longitude` | FLOAT | GPS Longitude |
| `photo_path` | VARCHAR | Path to verification selfie |
