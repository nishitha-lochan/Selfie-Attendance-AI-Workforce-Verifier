import cv2
import sys
import os
import base64
import time

# Add backend to path to import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app.utils.liveness_utils import verify_liveness, get_challenge
except ImportError:
    print("Error: Could not import liveness_utils. Ensure you are running from the backend directory or have it in your PYTHONPATH.")
    sys.exit(1)

def main():
    # Get a random challenge
    challenge = get_challenge()
    print(f"\n" + "="*40)
    print(f"CHALLENGE: {challenge['instruction']}")
    print("="*40)
    print("Get ready! Capturing from webcam in 2 seconds...")
    time.sleep(2)
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    frames_base64 = []
    duration = 5 # seconds
    start_time = time.time()
    
    print(f"Capturing for {duration} seconds. Please perform the action.")
    
    while time.time() - start_time < duration:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Display the frame with instruction
        display_frame = frame.copy()
        cv2.putText(display_frame, f"TASK: {challenge['instruction']}", (30, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Calculate remaining time
        remaining = int(duration - (time.time() - start_time))
        cv2.putText(display_frame, f"Time left: {remaining}s", (30, 90), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        cv2.imshow('Liveness Test - Press Q to stop', display_frame)
        
        # Convert to base64 for the verify function (as the API would receive it)
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        frames_base64.append(img_base64)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    
    if not frames_base64:
        print("No frames captured.")
        return
        
    print(f"\nCaptured {len(frames_base64)} frames. Verifying with backend logic...")
    
    success, message = verify_liveness(frames_base64, challenge['id'])
    
    print("-" * 40)
    if success:
        print(f"✅ Result: {message}")
    else:
        print(f"❌ Result: {message}")
    print("-" * 40)

if __name__ == "__main__":
    main()
