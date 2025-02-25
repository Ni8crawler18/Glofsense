import os
import cv2
import numpy as np
from skimage import filters, measure
from pathlib import Path

def create_directories():
    """Create necessary directories if they don't exist."""
    os.makedirs('preprocess_glof', exist_ok=True)
    os.makedirs('features', exist_ok=True)

def preprocess_image(image_path):
    """
    Preprocess SAR images for glacial lake detection.
    
    Args:
        image_path: Path to the input image
        
    Returns:
        processed_img: Processed binary image
        features: Dictionary containing area and perimeter
    """
    # Read image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        print(f"Error: Could not read image {image_path}")
        return None, None
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    
    # Apply Otsu's thresholding to segment water bodies (lakes appear bright in SAR images)
    _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Apply morphological operations to clean up the binary image
    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=2)
    
    # Fill small holes
    closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # Label connected components
    labeled_img = measure.label(closing)
    props = measure.regionprops(labeled_img)
    
    # Sort regions by area (descending) and keep only the largest one (assuming it's the lake)
    if props:
        props.sort(key=lambda x: x.area, reverse=True)
        lake_label = props[0].label
        
        # Create a mask for the lake
        lake_mask = np.zeros_like(labeled_img)
        lake_mask[labeled_img == lake_label] = 255
        
        # Calculate features
        area = props[0].area
        perimeter = props[0].perimeter
        
        features = {
            'area': area,
            'perimeter': perimeter,
            'area_perimeter_ratio': area / perimeter if perimeter > 0 else 0,
        }
        
        return lake_mask.astype(np.uint8), features
    
    return closing, {'area': 0, 'perimeter': 0, 'area_perimeter_ratio': 0}

def process_all_images():
    """Process all images in the glof_data folder and extract features."""
    create_directories()
    image_paths = sorted(Path('glof_data').glob('*.png'))
    
    if not image_paths:
        print("No images found in glof_data folder")
        return
    
    all_features = []
    
    for i, img_path in enumerate(image_paths):
        print(f"Processing image {i+1}/{len(image_paths)}: {img_path}")
        
        # Get image name without extension
        img_name = img_path.stem
        
        # Preprocess the image
        processed_img, features = preprocess_image(str(img_path))
        
        if processed_img is not None:
            # Save processed image
            output_path = f"preprocess_glof/{img_name}_processed.png"
            cv2.imwrite(output_path, processed_img)
            
            # Add filename to features
            features['filename'] = img_name
            all_features.append(features)
    
    # Save features to a CSV file
    import pandas as pd
    features_df = pd.DataFrame(all_features)
    features_df.to_csv('features/lake_features.csv', index=False)
    print(f"Processed {len(image_paths)} images. Features saved to features/lake_features.csv")

if __name__ == "__main__":
    process_all_images()