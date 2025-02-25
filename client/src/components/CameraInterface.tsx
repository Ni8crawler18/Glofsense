import React, { useRef, useEffect, useState } from 'react';
import { Camera, Upload, Settings, Play, Square, AlertTriangle } from 'lucide-react';

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
    h = 0;
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

function isWaterPixel(r: number, g: number, b: number): boolean {
  const [h, s, v] = rgbToHsv(r, g, b);
  return GLACIAL_LAKE_COLOR_RANGES.some(range => {
    return h >= range.lower[0] && h <= range.upper[0] &&
           s >= range.lower[1] && s <= range.upper[1] &&
           v >= range.lower[2] && v <= range.upper[2];
  });
}

function processImageData(imageData: ImageData): {
  processedImageData: ImageData;
  waterVolumes: WaterVolume[];
  totalVolume: number;
} {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const waterMask = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (isWaterPixel(data[idx], data[idx + 1], data[idx + 2])) {
        waterMask[y * width + x] = 1;
      }
    }
  }
  
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
          
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        
        if (area > 100) {
          const realWorldArea = area * (PIXEL_TO_METER_CONVERSION ** 2);
          const volume = realWorldArea * ESTIMATED_DEPTH;
          waterVolumes.push({ area: realWorldArea, volume, contour });
        }
      }
    }
  }
  
  const processedImageData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );
  
  waterVolumes.forEach(({ contour }) => {
    contour.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      processedImageData.data[idx] = 0;
      processedImageData.data[idx + 1] = 255;
      processedImageData.data[idx + 2] = 0;
      processedImageData.data[idx + 3] = 255;
    });
  });
  
  const totalVolume = waterVolumes.reduce((sum, { volume }) => sum + volume, 0);
  
  return { processedImageData, waterVolumes, totalVolume };
}

const CameraInterface: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sourceType, setSourceType] = useState<'webcam' | 'ipCamera' | 'file'>('webcam');
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [calibrationFactor, setCalibrationFactor] = useState<number>(PIXEL_TO_METER_CONVERSION);
  const [estimatedDepth, setEstimatedDepth] = useState<number>(ESTIMATED_DEPTH);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let animationFrameId: number;
    let videoStream: MediaStream | null = null;

    const startDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      setError('');
      
      try {
        if (sourceType === 'webcam') {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = videoStream;
        } else if (sourceType === 'ipCamera') {
          videoRef.current.src = ipCameraUrl;
        }
        
        await videoRef.current.play();
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        processFrame();
      } catch (error) {
        console.error('Error accessing video stream:', error);
        setError('Failed to access video stream. Please check your camera permissions.');
        setIsDetecting(false);
      }
    };

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || !isDetecting) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(
        videoRef.current,
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      
      const imageData = ctx.getImageData(
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      
      const processedData = processImageData(imageData);
      ctx.putImageData(processedData.processedImageData, 0, 0);
      setTotalVolume(processedData.totalVolume);
      
      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isDetecting) {
      startDetection();
    }

    return () => {
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
          setIsDetecting(true);
        };
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Camera className="w-6 h-6 mr-2 text-blue-500" />
                Glacial Lake Water Flow Detection
              </h1>
              <p className="text-gray-600 mt-1">Real-time monitoring and analysis of glacial lake conditions</p>
            </div>
            <button
              onClick={handleStartStop}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                isDetecting
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isDetecting ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Detection
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Detection
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-gray-600" />
                  Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video Source
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value as 'webcam' | 'ipCamera' | 'file')}
                    >
                      <option value="webcam">Webcam</option>
                      <option value="ipCamera">IP Camera</option>
                      <option value="file">Video File</option>
                    </select>
                  </div>

                  {sourceType === 'ipCamera' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IP Camera URL
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={ipCameraUrl}
                        onChange={(e) => setIpCameraUrl(e.target.value)}
                        placeholder="http://<IP>:<PORT>/video"
                      />
                    </div>
                  )}

                  {sourceType === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video File
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-8 h-8 text-blue-500" />
                          <span className="mt-2 text-base leading-normal">Select a file</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Calibration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pixel to Meter Ratio
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={calibrationFactor}
                      onChange={(e) => setCalibrationFactor(parseFloat(e.target.value))}
                      step="0.001"
                      min="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Depth (m)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={estimatedDepth}
                      onChange={(e) => setEstimatedDepth(parseFloat(e.target.value))}
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="relative">
              <video
                ref={videoRef}
                className="hidden"
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                <div className="text-sm font-medium">Water Volume</div>
                <div className="text-xl font-bold">{totalVolume.toFixed(2)} m³</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraInterface;