import face_recognition
import numpy as np
import cv2
import pickle
from io import BytesIO
from PIL import Image

def load_image_file(file_bytes: bytes):
    """Load image from bytes into numpy array."""
    image = face_recognition.load_image_file(BytesIO(file_bytes))
    return image

def get_face_encoding(image_bytes: bytes):
    """
    Detects face and returns (encoding, error_message).
    """
    try:
        image = load_image_file(image_bytes)
    except Exception:
         return None, "Invalid image format"
         
    # Detect faces
    face_locations = face_recognition.face_locations(image)
    
    if len(face_locations) == 0:
        return None, "No face detected in the image."
    
    if len(face_locations) > 1:
        return None, f"Multiple faces detected ({len(face_locations)}). Ensure only you are in the frame."
        
    face_encodings = face_recognition.face_encodings(image, face_locations)
    if face_encodings:
        return face_encodings[0], None
        
    return None, "Face detected but could not capture features."

def verify_face(known_encoding_bytes, check_encoding):
    """
    Compare stored encoding (bytes/pickle) with new encoding.
    """
    if known_encoding_bytes is None or check_encoding is None:
        return False
        
    # Load the known encoding
    known_encoding = pickle.loads(known_encoding_bytes)
    
    # Compare
    # Calculate distance for debugging
    face_distances = face_recognition.face_distance([known_encoding], check_encoding)
    distance = face_distances[0]
    print(f"DEBUG: Face Distance = {distance} (Tolerance: 0.45)")
    
    # tolerance=0.45 -> Very Strict to prevent false positives
    matches = face_recognition.compare_faces([known_encoding], check_encoding, tolerance=0.45)
    return matches[0], distance
