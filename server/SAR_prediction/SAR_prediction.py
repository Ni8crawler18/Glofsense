import requests
import numpy as np
import cv2
import joblib
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from datetime import datetime, timedelta
import os

# Configuration
CLIENT_ID = "e2ad423b-45f6-43ce-bbba-82e16cdc7643"
CLIENT_SECRET = "2VaDLxM7NCIPlb40TY9Y0Emvw5NicDkF"
INSTANCE_ID = "5c81bb48-6971-4aae-b9a0-5b8e15f1f1f5"
BBOX = [88.15, 27.95, 88.20, 28.00]
RESOLUTION = 10  # meters per pixel

def get_access_token():
    client = BackendApplicationClient(client_id=CLIENT_ID)
    oauth = OAuth2Session(client=client)
    return oauth.fetch_token(token_url=auth_url, client_secret=CLIENT_SECRET)['access_token']

def download_sentinel_images(time_range, max_images=30):
    # Optimized download function with time-based sorting
    headers = {"Authorization": f"Bearer {get_access_token()}"}
    params = {
        "bbox": BBOX,
        "datetime": time_range,
        "collections": ["sentinel-1-grd"],
        "limit": max_images,
        "sortby": [{"field": "properties.datetime", "direction": "desc"}]
    }
    response = requests.post(catalog_url, json=params, headers=headers)
    return process_image_metadata(response.json())

def process_image_metadata(data):
    # Extract and format image metadata
    return [
        {
            "date": feat["properties"]["datetime"].split("T")[0],
            "url": feat["assets"]["data"]["href"]
        } for feat in data.get("features", [])
    ]

def calculate_water_body_metrics(image_path):
    # SAR image processing pipeline
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    _, thresholded = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY+cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Metric calculations
    largest_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest_contour) * (RESOLUTION ** 2)
    perimeter = cv2.arcLength(largest_contour, True) * RESOLUTION
    return area, perimeter

def build_lstm_model(input_shape):
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=input_shape),
        LSTM(50),
        Dense(2)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

# Training Pipeline
def train_glof_model(image_dir):
    # Collect historical data
    historical_data = []
    for img_file in sorted(os.listdir(image_dir)):
        area, perimeter = calculate_water_body_metrics(os.path.join(image_dir, img_file))
        historical_data.append([area, perimeter])
    
    # Prepare time-series data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(historical_data)
    
    # Create sequences
    X, y = [], []
    for i in range(3, len(scaled_data)):
        X.append(scaled_data[i-3:i])
        y.append(scaled_data[i])
    
    # Train LSTM
    model = build_lstm_model((X[0].shape[0], X[0].shape[1]))
    model.fit(np.array(X), np.array(y), epochs=100, verbose=1)
    
    # Save model artifacts
    joblib.dump(scaler, 'glof_scaler.joblib')
    model.save('glof_lstm_model.h5')

# Prediction Function
def predict_glof_risk(model, scaler, recent_sequence):
    scaled_seq = scaler.transform(recent_sequence)
    prediction = model.predict(np.array([scaled_seq]))
    return scaler.inverse_transform(prediction)[0]