import cv2
import numpy as np
import face_recognition
import random
import logging
import base64

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
EAR_THRESHOLD = 0.25
CONSECUTIVE_FRAMES = 1
MOVEMENT_THRESHOLD = 20  # Increased slightly from 15 for more robust detection

CHALLENGES = {
    "blink_twice": "Blink twice",
    "turn_left": "Turn head LEFT",
    "turn_right": "Turn head RIGHT",
    "nod_up_down": "Nod head UP/DOWN"
}

def calculate_ear(eye_points):
    """
    Calculate the Eye Aspect Ratio (EAR) to detect blinks.
    eye_points: list of (x, y) coordinates for an eye.
    """
    # Vertical distances
    A = np.linalg.norm(np.array(eye_points[1]) - np.array(eye_points[5]))
    B = np.linalg.norm(np.array(eye_points[2]) - np.array(eye_points[4]))
    # Horizontal distance
    C = np.linalg.norm(np.array(eye_points[0]) - np.array(eye_points[3]))
    
    # EAR formula
    ear = (A + B) / (2.0 * C)
    return ear

def get_challenge():
    """
    Returns a random challenge instruction.
    """
    key = random.choice(list(CHALLENGES.keys()))
    return {"id": key, "instruction": CHALLENGES[key]}

def verify_liveness(frames_base64: list, challenge_id: str):
    """
    Verifies if the user completed the liveness challenge.
    frames_base64: List of base64 encoded strings.
    challenge_id: The ID of the challenge to verify.
    """
    blink_count = 0
    consecutive_closed_frames = 0
    nose_positions = []
    
    logger.info(f"Processing {len(frames_base64)} frames for challenge: {challenge_id}")

    for i, base64_str in enumerate(frames_base64):
        try:
            # Decode base64
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                continue

            # Resize for performance and convert to RGB
            # Grayscale is mentioned by user for optimization, but face_recognition works on RGB/BGR
            # We'll use a small scaled image for faster landmark detection
            small_img = cv2.resize(img, (0, 0), fx=0.5, fy=0.5)
            rgb_small_img = cv2.cvtColor(small_img, cv2.COLOR_BGR2RGB)
            
            # Detect landmarks
            landmarks_list = face_recognition.face_landmarks(rgb_small_img)
            if not landmarks_list:
                continue
                
            landmarks = landmarks_list[0]
            
            # --- Blink Detection Logic ---
            left_eye = landmarks.get('left_eye')
            right_eye = landmarks.get('right_eye')
            
            if left_eye and right_eye:
                left_ear = calculate_ear(left_eye)
                right_ear = calculate_ear(right_eye)
                avg_ear = (left_ear + right_ear) / 2.0
                
                if avg_ear < EAR_THRESHOLD:
                    consecutive_closed_frames += 1
                    logger.info(f"Frame {i}: Eyes CLOSED (EAR: {avg_ear:.3f})")
                else:
                    if consecutive_closed_frames >= CONSECUTIVE_FRAMES:
                        blink_count += 1
                        logger.info(f"Blink detected! Total: {blink_count}")
                    consecutive_closed_frames = 0
            
            # --- Head Movement Logic ---
            nose_tip = landmarks.get('nose_tip')
            if nose_tip:
                # Use the tip of the nose (usually the last point in the list for 68-point)
                nose_positions.append(nose_tip[-1])
                
        except Exception as e:
            logger.error(f"Error processing frame {i}: {e}")
            continue

    logger.info(f"Challenge Results -> Blinks: {blink_count}, Movement Points: {len(nose_positions)}")

    # Final Verification Logic
    if challenge_id == "blink_twice":
        if blink_count >= 2:
            return True, "Liveness verified: Blink twice successful"
        return False, f"Liveness verification failed: Detected {blink_count} blinks, expected 2"

    if len(nose_positions) < 5:
        return False, "Liveness verification failed: Could not track head movement consistently"

    start_pos = nose_positions[0]
    max_x_dist = 0
    min_x_dist = 0
    max_y_dist = 0
    min_y_dist = 0
    
    for pos in nose_positions:
        dx = pos[0] - start_pos[0]
        dy = pos[1] - start_pos[1]
        max_x_dist = max(max_x_dist, dx)
        min_x_dist = min(min_x_dist, dx)
        max_y_dist = max(max_y_dist, dy)
        min_y_dist = min(min_y_dist, dy)

    logger.info(f"Movement -> DX: [{min_x_dist:.1f}, {max_x_dist:.1f}], DY: [{min_y_dist:.1f}, {max_y_dist:.1f}] (Threshold: {MOVEMENT_THRESHOLD})")

    # Note: In standard camera view (mirrored):
    # Moving head LEFT (user's perspective) -> Nose moves RIGHT in image (x increases)
    # Moving head RIGHT (user's perspective) -> Nose moves LEFT in image (x decreases)
    # However, depending on frontend mirroring, we should check for significant delta.
    
    if challenge_id == "turn_left":
        # Moving head LEFT (user's perspective) -> Nose moves RIGHT in image (x increases)
        if max_x_dist > MOVEMENT_THRESHOLD:
            return True, "Liveness verified: Head turn LEFT successful"
        return False, f"Liveness verification failed: Head turn LEFT not detected (Max DX: {max_x_dist:.1f})"

    if challenge_id == "turn_right":
        # Moving head RIGHT (user's perspective) -> Nose moves LEFT in image (x decreases)
        if min_x_dist < -MOVEMENT_THRESHOLD:
            return True, "Liveness verified: Head turn RIGHT successful"
        return False, f"Liveness verification failed: Head turn RIGHT not detected (Min DX: {min_x_dist:.1f})"

    if challenge_id == "nod_up_down":
        # Nodding involves both up and down, but we check for significant vertical movement
        if abs(max_y_dist) > MOVEMENT_THRESHOLD or abs(min_y_dist) > MOVEMENT_THRESHOLD:
            return True, "Liveness verified: Head nod successful"
        return False, "Liveness verification failed: Head nod not detected"

    return False, "Liveness verification failed: Unknown challenge type"
