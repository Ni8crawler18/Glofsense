import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Thermometer, Droplets, Mountain, Compass, Activity, Waves } from 'lucide-react';

interface SensorDashboardProps {
  selectedLake: string;
}

const SensorDashboard: React.FC<SensorDashboardProps> = ({ selectedLake }) => {
  // Enhanced mock data with more realistic values
  const sensorData = {
    floating: {
      altitude: 4523,
      humidity: 65.8,
      latitude: 36.3219,
      longitude: 74.8707,
      temperature: 12.3,
      waterTemperature: 4.2,
      gyro: { x: 0.23, y: -0.12, z: 0.05 }
    },
    moraine: {
      humidity: 58.4,
      temperature: 15.2,
      vibration: 0.034
    }
  };

  // More realistic time series data
  const timeSeriesData = [
    { time: '00:00', temp: 10.2, waterTemp: 3.8, humidity: 62.5 },
    { time: '04:00', temp: 8.7, waterTemp: 3.5, humidity: 65.2 },
    { time: '08:00', temp: 12.4, waterTemp: 4.1, humidity: 60.8 },
    { time: '12:00', temp: 15.6, waterTemp: 4.3, humidity: 55.3 },
    { time: '16:00', temp: 14.2, waterTemp: 4.2, humidity: 58.7 },
    { time: '20:00', temp: 11.8, waterTemp: 3.9, humidity: 63.1 }
  ];

  const vibrationData = [
    { time: '00:00', value: 0.031 },
    { time: '04:00', value: 0.028 },
    { time: '08:00', value: 0.035 },
    { time: '12:00', value: 0.042 },
    { time: '16:00', value: 0.038 },
    { time: '20:00', value: 0.033 }
  ];

  const riskLevel = "medium";
  const riskColor = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500"
  }[riskLevel];

  return (
    <div className="space-y-6">
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
              <span className="font-semibold">{sensorData.floating.altitude.toFixed(0)}m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Humidity</span>
              </div>
              <span className="font-semibold">{sensorData.floating.humidity.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Temperature</span>
              </div>
              <span className="font-semibold">{sensorData.floating.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-gray-600">Water Temp</span>
              </div>
              <span className="font-semibold">{sensorData.floating.waterTemperature.toFixed(1)}°C</span>
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
            {Object.entries(sensorData.floating.gyro).map(([axis, value]) => (
              <div key={axis} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-gray-600">{axis.toUpperCase()}-axis</span>
                </div>
                <span className="font-semibold">{value.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Moraine Sensors */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <Mountain className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Moraine Sensors</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Humidity</span>
              </div>
              <span className="font-semibold">{sensorData.moraine.humidity.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Temperature</span>
              </div>
              <span className="font-semibold">{sensorData.moraine.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-gray-600 mr-2" />
                <span className="text-gray-600">Vibration</span>
              </div>
              <span className="font-semibold">{sensorData.moraine.vibration.toFixed(3)}</span>
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
              <LineChart data={timeSeriesData} className="chart-container">
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
                  dataKey="temp" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Temperature" 
                  dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="waterTemp" 
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
              <AreaChart data={vibrationData} className="chart-container">
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
                <Area 
                  type="monotone" 
                  dataKey="value" 
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

      {/* Risk Level Indicator */}
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
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
                <span>Updated every 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDashboard;