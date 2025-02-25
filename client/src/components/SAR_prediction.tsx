

  // Enhanced historical image data with SAR-specific metrics
  const historicalImages: ImageData[] = [
    {
<<<<<<< HEAD
      date: '2024-03-15',
      url: 'C:/Users/NITHISH/OneDrive/Desktop/CDAC/images/sentinel1_2025-02-13_IW_VV.png',
      area: 1250,
      perimeter: 450,
      backscatter: -15.2,
      coherence: 0.78,
      waterContent: 85
    },
    {
      date: '2024-03-01',
      url: 'C:/Users/NITHISH/OneDrive/Desktop/CDAC/images/sentinel1_2025-02-22_IW_VV.png',
      area: 1125,
      perimeter: 405,
      backscatter: -12.9,
      coherence: 0.82,
      waterContent: 78
    },
    {
      date: '2024-02-15',
      url: 'C:/Users/NITHISH/OneDrive/Desktop/CDAC/images/sentinel1_2025-02-25_IW_VV.png',
      area: 1000,
      perimeter: 380,
      backscatter: -11.6,
      coherence: 0.85,
      waterContent: 72
    }
  ];

  // Time series data for trends
  const trendData: TrendData[] = [
    { date: '2024-01-15', area: 950, perimeter: 360, backscatter: -10.8 },
    { date: '2024-02-01', area: 975, perimeter: 370, backscatter: -11.2 },
    { date: '2024-02-15', area: 1000, perimeter: 380, backscatter: -11.6 },
    { date: '2024-03-01', area: 1125, perimeter: 405, backscatter: -12.9 },
    { date: '2024-03-15', area: 1250, perimeter: 450, backscatter: -15.2 }
  ];

  const riskColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  };

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
=======
>>>>>>> 5ac4d434d4e602646bec9e68f8c5ccb3343b25e1

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

                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="area"

                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="backscatter"
                      name="Backscatter (dB)"
                      stroke="#82ca9d"
                      strokeWidth={2}

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


export default SARPrediction;