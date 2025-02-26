import type React from "react"
import { useState } from "react"
import {
  Activity,
  AlertCircle,
  Calendar,
  TrendingUp,
  Waves,
  Ruler,
  Maximize2,
  ArrowUpRight,
  BarChart3,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ImageData {
  date: string
  path: string
  area: number
  perimeter: number
  backscatter: number
  coherence: number
  waterContent: number
}

interface TrendData {
  date: string
  area: number
  perimeter: number
  backscatter: number
}

const SARPrediction: React.FC = () => {
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("low")
  const [areaChange, setAreaChange] = useState(0.015) // km²
  const [perimeterChange, setPerimeterChange] = useState(45.2) // m
  const [glofChance, setGlofChance] = useState(65) // percentage
  const [backscatterChange, setBackscatterChange] = useState(-2.3) // dB
  const [coherenceChange, setCoherenceChange] = useState(-0.07) // 0-1
  const [surfaceDisplacement, setSurfaceDisplacement] = useState(0.15) // m/day

  // Enhanced historical image data with SAR-specific metrics
  const historicalImages: ImageData[] = [
    {
      date: "2025-02-25",

      path: "/SAR_prediction/glof_data/sentinel1_2025-02-25_IW_VV.png",

      area: 1.26,
      perimeter: 4500,
      backscatter: -15.2,
      coherence: 0.78,
      waterContent: 85,
    },
    {
      date: "2025-02-22",

      path: "/SAR_prediction/glof_data/sentinel1_2025-02-22_IW_VV.png",

      area: 1.245,
      perimeter: 4455,
      backscatter: -12.9,
      coherence: 0.82,
      waterContent: 78,
    },
    {
      date: "2025-02-13",

      path: "/SAR_prediction/glof_data/sentinel1_2025-02-13_IW_VV.png",

      area: 1.235,
      perimeter: 4410,
      backscatter: -11.6,
      coherence: 0.85,
      waterContent: 72,
    },
  ]

  // Time series data for trends
  const trendData: TrendData[] = [
    { date: "2025-02-01", area: 1.22, perimeter: 4360, backscatter: -10.8 },
    { date: "2025-02-10", area: 1.23, perimeter: 4390, backscatter: -11.2 },
    { date: "2025-02-13", area: 1.235, perimeter: 4410, backscatter: -11.6 },
    { date: "2025-02-22", area: 1.245, perimeter: 4455, backscatter: -12.9 },
    { date: "2025-02-25", area: 1.26, perimeter: 4500, backscatter: -15.2 },
  ]

  const riskColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header with Technical Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">SAR-based GLOF Risk Analysis</h1>
            <p className="text-gray-600 mt-1">
              Synthetic Aperture Radar interferometry analysis with multi-temporal backscatter assessment
            </p>
          </div>

          {/* Changes in Primary Metrics */}
          <div className="mb-8 bg-blue-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Changes in Primary Metrics (2025-02-25 to 2025-02-13)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Area Change</span>
                <p className="font-bold text-blue-600">+0.025 km²</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Perimeter Change</span>
                <p className="font-bold text-blue-600">+90 m</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Backscatter Change</span>
                <p className="font-bold text-blue-600">-3.6 dB</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Coherence Change</span>
                <p className="font-bold text-blue-600">-0.07</p>
              </div>
            </div>
          </div>

          {/* Risk Assessment Section */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Level Indicator */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Risk Assessment</h3>
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div className="relative w-40 h-40 mx-auto">
                  <div className={`absolute inset-0 flex items-center justify-center`}>
                    <div className={`w-32 h-32 rounded-full ${riskColors[riskLevel]} opacity-20 animate-pulse`}></div>
                    <div className={`w-24 h-24 rounded-full ${riskColors[riskLevel]} opacity-40`}></div>
                    <div className={`w-16 h-16 rounded-full ${riskColors[riskLevel]}`}></div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <h4 className="text-2xl font-bold capitalize">{riskLevel} Risk</h4>
                  <p className="text-gray-600">Last updated: {new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Primary Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Primary Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Maximize2 className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">Area Change</span>
                    </div>
                    <span className="font-bold text-lg">{areaChange.toFixed(3)} km²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Ruler className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">Perimeter Change</span>
                    </div>
                    <span className="font-bold text-lg">{perimeterChange} m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Waves className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">GLOF Probability</span>
                    </div>
                    <span className="font-bold text-lg">{glofChance}%</span>
                  </div>
                </div>
              </div>

              {/* SAR Technical Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">SAR Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">Backscatter Δ</span>
                    </div>
                    <span className="font-bold text-lg">{backscatterChange} dB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">Coherence Δ</span>
                    </div>
                    <span className="font-bold text-lg">{coherenceChange.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ArrowUpRight className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-gray-600">Surface Displacement</span>
                    </div>
                    <span className="font-bold text-lg">{surfaceDisplacement} m/day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
              Temporal Analysis
            </h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis yAxisId="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="area"
                      name="Area (km²)"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ stroke: "#8884d8", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#8884d8", strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="backscatter"
                      name="Backscatter (dB)"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ stroke: "#82ca9d", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#82ca9d", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent SAR Images Comparison */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6">Recent SAR Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {historicalImages.slice(0, 2).map((image, index) => (
                <div key={image.date} className="bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={image.path || "/placeholder.svg"}
                    alt={`SAR image from ${image.date}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-gray-600">{image.date}</span>
                      </div>
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Backscatter</span>
                        <p className="font-bold">{image.backscatter} dB</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Coherence</span>
                        <p className="font-bold">{image.coherence}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Area</span>
                        <p className="font-bold">{image.area.toFixed(3)} km²</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Water Content</span>
                        <p className="font-bold">{image.waterContent}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Analysis */}
          <div>
            <h2 className="text-xl font-bold mb-6">Historical SAR Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {historicalImages.map((image) => (
                <div key={image.date} className="bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={image.path || "/placeholder.svg"}
                    alt={`SAR image from ${image.date}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-gray-600">{image.date}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Backscatter: {image.backscatter} dB</div>
                      <div>Area: {image.area.toFixed(3)} km²</div>
                      <div>Coherence: {image.coherence}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SARPrediction;