import os
import requests
from datetime import datetime
import numpy as np
import cv2
import matplotlib.pyplot as plt
from skimage import measure
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session
import joblib

# Sentinel Hub credentials
CLIENT_ID = "e2ad423b-45f6-43ce-bbba-82e16cdc7643"
CLIENT_SECRET = "2VaDLxM7NCIPlb40TY9Y0Emvw5NicDkF"
INSTANCE_ID = "5c81bb48-6971-4aae-b9a0-5b8e15f1f1f5"

# South Lhonak Lake region coordinates
BBOX = [88.15, 27.95, 88.20, 28.00]  # [minLon, minLat, maxLon, maxLat]

class SentinelDataManager:
    def __init__(self, client_id, client_secret, instance_id, bbox):
        self.client_id = client_id
        self.client_secret = client_secret
        self.instance_id = instance_id
        self.bbox = bbox
        self.token = None
        self.output_dir = os.path.join(os.getcwd(), "glof_data")
        os.makedirs(self.output_dir, exist_ok=True)
    
    def authenticate(self):
        """Authenticate with Sentinel Hub and get access token"""
        auth_url = "https://services.sentinel-hub.com/oauth/token"
        client = BackendApplicationClient(client_id=self.client_id)
        oauth = OAuth2Session(client=client)
        token = oauth.fetch_token(token_url=auth_url, client_secret=self.client_secret)
        self.token = token['access_token']
        return self.token
    
    def get_available_dates(self, start_date="2023-01-01", end_date=None, limit=30):
        """Get available image dates from Sentinel Hub Catalog API"""
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        if not self.token:
            self.authenticate()
        
        catalog_url = "https://services.sentinel-hub.com/api/v1/catalog/search"
        
        payload = {
            "bbox": self.bbox,
            "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
            "collections": ["sentinel-1-grd"],
            "limit": limit
        }
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
        
        response = requests.post(catalog_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if "features" in data and len(data["features"]) > 0:
                # Extract dates and sort chronologically
                image_dates = [feature["properties"]["datetime"].split("T")[0] 
                              for feature in data["features"]]
                image_dates.sort()  # Sort dates chronologically
                print(f"✅ Found {len(image_dates)} Sentinel-1 images.")
                return image_dates
            else:
                print("❌ No Sentinel-1 images found in the given time range.")
                return []
        else:
            print(f"❌ Failed to query Sentinel Hub Catalog API: {response.text}")
            return []
    
    def download_image(self, date, layer="IW_VV", resolution=1024):
        """Download Sentinel-1 image for a specific date"""
        if not self.token:
            self.authenticate()
            
        wms_url = f"https://services.sentinel-hub.com/ogc/wms/{self.instance_id}"
        
        params = {
            "SERVICE": "WMS",
            "VERSION": "1.1.1",
            "REQUEST": "GetMap",
            "LAYERS": layer,
            "STYLES": "",
            "FORMAT": "image/png",
            "WIDTH": resolution,
            "HEIGHT": resolution,
            "BBOX": ",".join(map(str, self.bbox)),
            "CRS": "EPSG:4326",
            "TIME": date
        }
        
        file_path = os.path.join(self.output_dir, f"sentinel1_{date}_{layer}.png")
        
        # If file already exists, skip download
        if os.path.exists(file_path):
            print(f"✅ Image already exists: {file_path}")
            return file_path
            
        image_response = requests.get(wms_url, params=params, stream=True)
        
        if image_response.status_code == 200:
            with open(file_path, "wb") as f:
                for chunk in image_response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"✅ Downloaded: {file_path}")
            return file_path
        else:
            print(f"❌ Failed to download image for {date}: {image_response.text}")
            return None
    
    def download_time_series(self, start_date="2023-01-01", end_date=None, layer="IW_VV", limit=100):
        """Download a time series of Sentinel-1 images"""
        dates = self.get_available_dates(start_date, end_date, limit)
        image_paths = []
        
        for date in dates:
            image_path = self.download_image(date, layer)
            if image_path:
                image_paths.append((date, image_path))
                
        return image_paths

# Example usage:
if __name__ == "__main__":
    manager = SentinelDataManager(CLIENT_ID, CLIENT_SECRET, INSTANCE_ID, BBOX)
    # Download the last 10 available images
    images = manager.download_time_series(limit=100)
    print(f"Downloaded {len(images)} images")