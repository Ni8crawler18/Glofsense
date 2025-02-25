import cv2
import numpy as np
import streamlit as st

PIXEL_TO_METER_CONVERSION = 0.01  # 1 pixel = 0.01 meters
ESTIMATED_DEPTH = 0.5  # Assumed depth of water flow in meters

glacial_lake_color_ranges = [
    (np.array([75, 50, 50]), np.array([120, 255, 255])),  # Turquoise/Blue-Green
    (np.array([100, 50, 50]), np.array([140, 255, 255])),  # Deep Blue
    (np.array([60, 50, 50]), np.array([80, 255, 255])),    # Emerald Green
    (np.array([90, 20, 150]), np.array([120, 100, 255]))   # Milky Blue/Grayish Blue
]

def process_frame(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    water_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for lower, upper in glacial_lake_color_ranges:
        mask = cv2.inRange(hsv, lower, upper)
        water_mask = cv2.bitwise_or(water_mask, mask)
    
    contours, _ = cv2.findContours(water_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    annotated_frame = frame.copy()
    total_volume = 0
    for contour in contours:
        pixel_area = cv2.contourArea(contour)
        if pixel_area > 100:
            real_world_area = pixel_area * (PIXEL_TO_METER_CONVERSION ** 2)
            volume = real_world_area * ESTIMATED_DEPTH
            total_volume += volume
            x, y, w, h = cv2.boundingRect(contour)
            cv2.drawContours(annotated_frame, [contour], -1, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"Volume: {volume:.2f} m^3", (x, y - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return annotated_frame, total_volume

def main():
    st.title("Glacial Lake Water Flow Detection")
    source = st.selectbox("Select Video Source", ["Webcam", "IP Camera"])
    ip_url = ""
    if source == "IP Camera":
        ip_url = st.text_input("Enter IP Camera URL", "http://<IP>:<PORT>/video")
    
    if st.button("Start Detection"):
        cap = cv2.VideoCapture(0 if source == "Webcam" else ip_url)
        if not cap.isOpened():
            st.error("Failed to open video source!")
            return
        
        stframe = st.image([])
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            annotated_frame, total_volume = process_frame(frame)
            stframe.image(cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB), 
                          caption=f"Total Water Flow Volume: {total_volume:.2f} m³", channels="RGB")
        
        cap.release()

if __name__ == "__main__":
    main()