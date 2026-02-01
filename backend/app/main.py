from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes
from app.core.database import engine, Base
import os

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Selfie Attendance API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(routes.router, prefix="/api")

# Static files for Uploads
os.makedirs("uploads/attendance", exist_ok=True)
os.makedirs("uploads/employees", exist_ok=True)
# We mount 'uploads' to '/static' so frontend can fetch images
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.get("/")
def read_root():
    return {"message": "Selfie Attendance API is running"}
