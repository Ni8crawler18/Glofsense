import React, { useRef, useEffect, useState } from 'react';

// Types for TypeScript
interface ColorRange {
  lower: [number, number, number];
  upper: [number, number, number];
}

interface WaterVolume {
  area: number;
  volume: number;
  contour: Array<[number, number]>;
}

// Constants
const PIXEL_TO_METER_CONVERSION = 0.01;  // 1 pixel = 0.01 meters
const ESTIMATED_DEPTH = 0.5;  // Assumed depth of water flow in meters

// Color ranges for glacial lake detection
const GLACIAL_LAKE_COLOR_RANGES: ColorRange[] = [
  { lower: [75, 50, 50], upper: [120, 255, 255] },  // Turquoise/Blue-Green
  { lower: [100, 50, 50], upper: [140, 255, 255] }, // Deep Blue
  { lower: [60, 50, 50], upper: [80, 255, 255] },   // Emerald Green
  { lower: [90, 20, 150], upper: [120, 100, 255] }  // Milky Blue/Grayish Blue
];

/**
 * Function to check if a pixel color is within any of the defined ranges
 */
function isWaterPixel(r: number, g: number, b: number): boolean {
  // Convert RGB to HSV
  const [h, s, v] = rgbToHsv(r, g, b);
  
  // Check if the HSV values fall within any of our defined ranges
  return GLACIAL_LAKE_COLOR_RANGES.some(range => {
    return h >= range.lower[0] && h <= range.upper[0] &&
           s >= range.lower[1] && s <= range.upper[1] &&
           v >= range.lower[2] && v <= range.upper[2];
  });
}

/**
 * Convert RGB to HSV color space
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;
  
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  
  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 180, s * 255, v * 255];
}

/**
 * Process a frame to detect water and calculate volume
 */
function processImageData(imageData: ImageData): {
  processedImageData: ImageData,
  waterVolumes: WaterVolume[],
  totalVolume: number
} {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Create a binary mask for water pixels
  const waterMask = new Uint8Array(width * height);
  
  // Mark water pixels in the mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (isWaterPixel(r, g, b)) {
        waterMask[y * width + x] = 1;
      }
    }
  }
  
  // Find connected components (a simplified approach compared to OpenCV's findContours)
  const visited = new Set<number>();
  const waterVolumes: WaterVolume[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      
      if (waterMask[pixelIndex] === 1 && !visited.has(pixelIndex)) {
        const contour: Array<[number, number]> = [];
        const stack: Array<[number, number]> = [[x, y]];
        let area = 0;
        
        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          const idx = cy * width + cx;
          
          if (cx < 0 || cy < 0 || cx >= width || cy >= height || visited.has(idx) || waterMask[idx] !== 1) {
            continue;
          }
          
          visited.add(idx);
          contour.push([cx, cy]);
          area++;
          
          // Add neighbors to stack
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        
        if (area > 100) { // Filter small regions
          const realWorldArea = area * (PIXEL_TO_METER_CONVERSION ** 2);
          const volume = realWorldArea * ESTIMATED_DEPTH;
          
          waterVolumes.push({
            area: realWorldArea,
            volume,
            contour
          });
        }
      }
    }
  }
  
  // Create a copy of the original image for annotation
  const processedImageData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );
  
  // Annotate the image
  waterVolumes.forEach(({ contour, volume }) => {
    // Find bounding rectangle
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    contour.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      
      // Draw contour in green
      const idx = (y * width + x) * 4;
      processedImageData.data[idx] = 0;       // R
      processedImageData.data[idx + 1] = 255; // G
      processedImageData.data[idx + 2] = 0;   // B
      processedImageData.data[idx + 3] = 255; // A
    });
    
    // We would add text here in a real implementation
    // But drawing text on ImageData is complex and unnecessary for this example
  });
  
  // Calculate total volume
  const totalVolume = waterVolumes.reduce((sum, { volume }) => sum + volume, 0);
  
  return {
    processedImageData,
    waterVolumes,
    totalVolume
  };
}

/**
 * React component for Glacial Lake Detection
 */
const GlacialLakeDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceType, setSourceType] = useState<'webcam' | 'ipCamera' | 'file'>('webcam');
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [calibrationFactor, setCalibrationFactor] = useState<number>(PIXEL_TO_METER_CONVERSION);
  const [estimatedDepth, setEstimatedDepth] = useState<number>(ESTIMATED_DEPTH);
  
  useEffect(() => {
    let animationFrameId: number;
    let videoStream: MediaStream | null = null;
    
    const startDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      try {
        if (sourceType === 'webcam') {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = videoStream;
        } else if (sourceType === 'ipCamera') {
          videoRef.current.src = ipCameraUrl;
        }
        
        await videoRef.current.play();
        
        // Resize canvas to match video dimensions
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Start the processing loop
        processFrame();
      } catch (error) {
        console.error('Error accessing video stream:', error);
        setIsDetecting(false);
      }
    };
    
    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isDetecting) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Draw the current video frame on the canvas
      ctx.drawImage(
        videoRef.current,
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      
      // Get the image data from the canvas
      const imageData = ctx.getImageData(
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      
      // Process the image data
      const { processedImageData, totalVolume } = processImageData(imageData);
      
      // Update the canvas with the processed image
      ctx.putImageData(processedImageData, 0, 0);
      
      // Update total volume state
      setTotalVolume(totalVolume);
      
      // Request the next animation frame
      animationFrameId = requestAnimationFrame(processFrame);
    };
    
    if (isDetecting) {
      startDetection();
    }
    
    return () => {
      // Clean up
      cancelAnimationFrame(animationFrameId);
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isDetecting, sourceType, ipCameraUrl]);
  
  const handleStartStop = () => {
    setIsDetecting(!isDetecting);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const url = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.onloadeddata = () => {
          videoRef.current?.play();
          setIsDetecting(true); // Start detection when video is loaded
        };
      }
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
  <h1 className="text-2xl font-bold mb-4">Glacial Lake Water Flow Detection</h1>
  <div className="mb-4">
    <div className="flex gap-4 mb-2">
      <div>
        <label className="block mb-1">Video Source</label>
        <select
          className="p-2 border rounded"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as 'webcam' | 'ipCamera' | 'file')}
        >
          <option value="webcam">Webcam</option>
          <option value="ipCamera">IP Camera</option>
          <option value="file">Video File</option>
        </select>
      </div>

      {sourceType === 'ipCamera' && (
        <div className="flex-1">
          <label className="block mb-1">IP Camera URL</label>
          <input
            type="text"
            className="p-2 border rounded w-full"
            value={ipCameraUrl}
            onChange={(e) => setIpCameraUrl(e.target.value)}
            placeholder="http://<IP>:<PORT>/video"
          />
        </div>
      )}

      {sourceType === 'file' && (
        <div className="flex-1">
          <label className="block mb-1">Choose Video File</label>
          <input
            type="file"
            className="p-2 border rounded w-full"
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>

    <div className="flex gap-4 mb-2">
      <div>
        <label className="block mb-1">Pixel to Meter Conversion</label>
        <input
          type="number"
          className="p-2 border rounded"
          value={calibrationFactor}
          onChange={(e) => setCalibrationFactor(parseFloat(e.target.value))}
          step="0.001"
          min="0.001"
        />
      </div>

      <div>
        <label className="block mb-1">Estimated Depth (m)</label>
        <input
          type="number"
          className="p-2 border rounded"
          value={estimatedDepth}
          onChange={(e) => setEstimatedDepth(parseFloat(e.target.value))}
          step="0.1"
          min="0.1"
        />
      </div>
    </div>

    <button
      className={`p-2 rounded ${isDetecting ? 'bg-red-500' : 'bg-blue-500'} text-white`}
      onClick={handleStartStop}
    >
      {isDetecting ? 'Stop Detection' : 'Start Detection'}
    </button>
  </div>

  <div className="relative bg-white min-h-[400px] pb-8"> {/* Add min-height and padding-bottom */}
    <video
      ref={videoRef}
      className="hidden"
      muted
      playsInline
    />
    <canvas
      ref={canvasRef}
      className="w-full border"
    />
    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded">
      Total Water Flow Volume: {totalVolume.toFixed(2)} m³
    </div>
  </div>
</div>

  );
};

export default GlacialLakeDetection;