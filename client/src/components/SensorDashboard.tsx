import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Thermometer, Droplets, Mountain, Compass, Activity, Waves, Sun, CloudRain, Wind } from 'lucide-react';
import { ref, onValue } from "firebase/database";
import { database } from '../firebase';
import axios from "axios";

interface SensorDashboardProps {
  selectedLake: string;
  setRiskLevel: React.Dispatch<React.SetStateAction<"low" | "medium" | "high">>;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({ selectedLake, setRiskLevel }) => {
  const [latestSensor, setLatestSensor] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("all");
  const [riskLevel, setLocalRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [riskColor, setRiskColor] = useState<string>("bg-yellow-500");
  const [floatGraphData, setFloatGraphData] = useState<any[]>([]);
  const [shoreGraphData, setShoreGraphData] = useState<any[]>([]);
  const [gyroGraphData, setGyroGraphData] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>("");
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [waveAmplitude, setWaveAmplitude] = useState<number>(100);
  const [weatherData, setWeatherData] = useState<any>(null);
    let socket = new WebSocket("ws://192.168.196.64:81");

    socket.onopen = function () {
      console.log("Connected to ESP32 WebSocket");
    };

    socket.onerror = function (error) {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = function () {
      console.log("WebSocket Disconnected. Attempting to reconnect...");
      setTimeout(() => {
        socket = new WebSocket("ws://192.168.196.64:81");
      }, 3000);
    };

    function sendRiskLevel(level: "low" | "medium" | "high") {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(`${level}`);
        console.log(`Sent risk level to ESP32: RISK_LEVEL:${level}`);
      } else {
        console.error("WebSocket not connected");
      }
    }

  // Update the calculateWaveHeight function to also set wave amplitude
  const calculateWaveHeight = (altitude: number) => {
    const maxAltitude = 2500;
    // Calculate water level percentage (inversely proportional to altitude)
    const invertedPercentage = ((maxAltitude - altitude) / maxAltitude) * 70;
    const actualPercentage = 100 - invertedPercentage;
    
    // Calculate wave amplitude (higher altitude = smaller waves)
    const amplitudePercentage = Math.max(10, 100 - (altitude / maxAltitude * 90));
    setWaveAmplitude(amplitudePercentage);
    
    return actualPercentage;
  };

  useEffect(() => {
    const userId = "ggVVdic7v3gqsBkbQIRYWvlxOFo2"; // Replace with actual user ID
    const dataRef = ref(database, `UsersData/${userId}/readings`);

    const unsubscribe = onValue(
      dataRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          console.error("No data found");
          return;
        }

        const sensorEntries = Object.entries(data);
        if (sensorEntries.length === 0) {
          console.error("No sensor readings available");
          return;
        }

        sensorEntries.sort(([a], [b]) => Number(a) - Number(b));

        const [latestTimestamp, latestValues] = sensorEntries[sensorEntries.length - 1];
        const { floatLatitude, floatLongitude, ...filteredValues } = latestValues as {
          floatLatitude: string;
          floatLongitude: string;
          [key: string]: any;
        };
        setLatestSensor({ timestamp: latestTimestamp, ...filteredValues });
        fetchLocationName(parseFloat(floatLatitude), parseFloat(floatLongitude));
        updateGraphData(sensorEntries, timeRange);
        getPrediction(filteredValues);
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
    );

    return () => unsubscribe();
  }, [timeRange]);

  useEffect(() => {
    if (latestSensor?.floatAltitude) {
      const altitude = parseFloat(latestSensor.floatAltitude);
      setWaterLevel(calculateWaveHeight(altitude));
    }
  }, [latestSensor?.floatAltitude]);

  const fetchLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationName(data.display_name.split(",")[0]);
      } else {
        setLocationName("Location not found");
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
      setLocationName("Error fetching location");
    }
  };

  useEffect(() => {
    // Fetch weather data
    const fetchWeatherData = async () => {
      try {
        const API_KEY = "1d351480961961f5fdb5c9a93c6444c4";
        const lat = 27.9456; // Replace with actual latitude
        const lon = 88.3324 ;
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        setWeatherData(response.data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };

    fetchWeatherData();
  }, [selectedLake]);

  const getPrediction = async (sensorData: any) => {
    try {
      const features = [
        sensorData.floatTemperature,
        sensorData.floatHumidity,
        sensorData.floatWaterTemperature,
        sensorData.floatAltitude,
        sensorData["floatX-Axis"],
        sensorData["floatY-Axis"],
        sensorData["floatZ-Axis"],
        sensorData.shoreTemperature,
        sensorData.shoreVibration,
        sensorData.floatVelocity,
      ].map(value => isNaN(parseFloat(value)) ? 0 : parseFloat(value));

      const response = await axios.post("https://glof-backend.onrender.com/predict", { features });

      const probabilities = response.data.probabilities; // Directly access array
      
      if (!Array.isArray(probabilities) || probabilities.length !== 3) {
        console.error("Invalid probabilities format:", response.data);
        return;
      }
      
      const riskLabels: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      
      const newRiskLevel = riskLabels[maxIndex];
      setLocalRiskLevel(newRiskLevel);
      setRiskLevel(newRiskLevel);
      
      const riskColors: { [key in "low" | "medium" | "high"]: string } = { low: "bg-green-500", medium: "bg-yellow-500", high: "bg-red-500" };
      setRiskColor(riskColors[riskLabels[maxIndex]]);
      sendRiskLevel(riskLabels[maxIndex]);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };

  const updateGraphData = (data: any[], range: string) => {
    const now = Date.now() / 1000;
    let filteredData;

    switch (range) {
      case "hour":
        filteredData = data.filter(([timestamp]) => now - Number(timestamp) <= 3600);
        break;
      case "day":
      case "week":
        filteredData = data.filter(([timestamp]) => now - Number(timestamp) <= 604800);
        break;
      case "all":
        filteredData = data;
        break;
      default:
        filteredData = data;
    }

    const formattedFloatData = filteredData.map(([timestamp, values]) => ({
      time: new Date(Number(timestamp) * 1000).toLocaleString(),
      temperature: parseFloat(values.floatTemperature || 0),
      humidity: parseFloat(values.floatHumidity || 0),
      waterTemperature: parseFloat(values.floatWaterTemperature || 0)
    }));

    const formattedShoreData = filteredData.map(([timestamp, values]) => ({
      time: new Date(Number(timestamp) * 1000).toLocaleString(),
      temperature: parseFloat(values.shoreTemperature || 0),
      humidity: parseFloat(values.shoreHumidity || 0),
      vibration: parseFloat(values.shoreVibration || 0)
    }));
    const formattedGyroData = filteredData.map(([timestamp, values]) => ({
      time: new Date(Number(timestamp) * 1000).toLocaleString(),
      magnitude: Math.sqrt(
        Math.pow(parseFloat(values['floatX-Axis'] || 0), 2) +
        Math.pow(parseFloat(values['floatY-Axis'] || 0), 2) +
        Math.pow(parseFloat(values['floatZ-Axis'] || 0), 2)
      )
    }));
    setGyroGraphData(formattedGyroData);

    setFloatGraphData(formattedFloatData);
    setShoreGraphData(formattedShoreData);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="hour">Last Hour</option>
          <option value="day">Last Day</option>
          <option value="week">Last Week</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex justify-between">
        {/* Risk Level Indicator */}
        <div className="flex items-center space-x-6">
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full ${riskColor} opacity-20 risk-pulse`}></div>
              <div className={`w-24 h-24 rounded-full ${riskColor} opacity-40`}></div>
              <div className={`w-16 h-16 rounded-full ${riskColor}`}></div>
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-semibold capitalize">{riskLevel} Risk</h4>
            <p className="text-gray-600 mt-1">Based on current sensor readings</p>
            <div className="mt-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Activity className="w-4 h-4 mr-2" />
                <span>Updated every 2 Seconds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Information */}
        {weatherData && (
        <div className="flex flex-col items-center space-y-2 mr-10">
          <h4 className="text-lg font-semibold">Weather Data</h4>
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-700">{weatherData.main.temp}°C</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">{weatherData.wind.speed} m/s</span>
          </div>
          <div className="flex items-center space-x-2">
            <CloudRain className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{weatherData.weather[0].description}</span>
          </div>
        </div>
      )}

      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Floating Sensors */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <Waves className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Floating Sensors</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Mountain className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Altitude</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.floatAltitude === 'string' ? parseFloat(latestSensor.floatAltitude).toFixed(0) : 'N/A'}m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Humidity</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.floatHumidity === 'string' ? parseFloat(latestSensor.floatHumidity).toFixed(1) : 'N/A'}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Temperature</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.floatTemperature === 'string' ? parseFloat(latestSensor.floatTemperature).toFixed(1) : 'N/A'}°C</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-600">Water Temp</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.floatWaterTemperature === 'string' ? parseFloat(latestSensor.floatWaterTemperature).toFixed(1) : 'N/A'}°C</span>
            </div>
          </div>
        </div>

        {/* Gyroscope Data */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <Compass className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Gyroscope Data</h3>
          </div>
          <div className="space-y-4">
            {['X', 'Y', 'Z'].map(axis => (
              <div key={axis} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-gray-600">{axis}-axis</span>
                </div>
                <span className="font-semibold">{typeof latestSensor?.[`float${axis}-Axis`] === 'string' ? parseFloat(latestSensor[`float${axis}-Axis`]).toFixed(3) : 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Moraine Sensors */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <Mountain className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Shore Sensors</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Humidity</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.shoreHumidity === 'string' ? parseFloat(latestSensor.shoreHumidity).toFixed(1) : 'N/A'}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Temperature</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.shoreTemperature === 'string' ? parseFloat(latestSensor.shoreTemperature).toFixed(1) : 'N/A'}°C</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Vibration</span>
              </div>
              <span className="font-semibold">{typeof latestSensor?.shoreVibration === 'string' ? parseFloat(latestSensor.shoreVibration).toFixed(3) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold mb-4">Temperature & Humidity Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={floatGraphData} className="chart-container">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Temperature" 
                  dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="waterTemperature" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Water Temperature" 
                  dot={{ stroke: '#82ca9d', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#82ca9d', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Humidity" 
                  dot={{ stroke: '#ffc658', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#ffc658', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold mb-4">Vibration Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shoreGraphData} className="chart-container">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 1200]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="vibration" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Vibration"
                  activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Gyroscope Data Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold mb-4">Gyroscope Data Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gyroGraphData} className="chart-container">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="magnitude" 
                  stroke="#D8544F" 
                  strokeWidth={2}
                  name="Magnitude" 
                  dot={{ stroke: '#D8544F', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#D8544F', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Level Animation - Updated */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Water Level Animation</h3>
          </div>

          <div className="relative h-80 flex">
            {/* Scale */}
            <div className="scale-container w-16 h-full flex flex-col justify-between text-sm text-gray-600 pr-2 border-r border-gray-200">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center justify-end w-full">
                  <span className="mr-1">{(5000 - index * 1000).toString()}</span>
                  <div className="w-2 border-t border-gray-300"></div>
                </div>
              ))}
            </div>

            {/* Wave Animation */}
            <div 
              className="wave-container flex-1" 
              style={{ 
                '--wave-height': `${waterLevel}%`,
                '--wave-amplitude': `${waveAmplitude}%` 
              } as React.CSSProperties}
            >
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="absolute right-2 top-2 bg-white px-2 py-1 rounded-md shadow-sm text-sm">
                {typeof latestSensor?.floatAltitude === 'string' ? `${parseFloat(latestSensor.floatAltitude).toFixed(0)}m` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Combined styles */}
        <style>
          {`
          .wave-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: white;
            border-radius: 0.5rem;
          }
          .scale-container {
            font-family: monospace;
            min-width: 4rem;
          }
          .wave {
            position: absolute;
            bottom: 0;
            width: 200%;
            height: calc(var(--wave-height) * 3%);
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 30" preserveAspectRatio="none"><path d="M0,15 C150,30 350,0 600,15 C850,30 1050,0 1200,15 L1200,30 L0,30 Z" fill="%230288d1"/></svg>');
            background-size: 50% 100%;
            animation: wave-animation 5s infinite linear;
            opacity: 0.7;
            transition: height 0.5s ease;
          }
          .wave:nth-child(2) {
            bottom: 3px;
            height: calc(var(--wave-height) * 0.9);
            animation-duration: 7s;
            opacity: 0.5;
          }
          .wave:nth-child(3) {
            bottom: 6px;
            height: calc(var(--wave-height) * 0.7);
            animation-duration: 10s;
            opacity: 0.3;
          }
          @keyframes wave-animation {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .risk-pulse {
            animation: risk-pulse-animation 2s infinite;
          }
          @keyframes risk-pulse-animation {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.1); opacity: 0.3; }
            100% { transform: scale(1); opacity: 0.2; }
          }
          `}
        </style>
      </div>
    </div>
  );
};

export default SensorDashboard;