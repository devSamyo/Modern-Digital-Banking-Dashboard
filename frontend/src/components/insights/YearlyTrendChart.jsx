import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useInsights } from '../../hooks/useInsights';

const YearlyTrendChart = () => {
  const { yearlyTrend, loading, fetchYearlyTrend } = useInsights();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchYearlyTrend(selectedYear);
  }, [selectedYear]);

  // Generate year options (current year and last 3 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  if (loading && !yearlyTrend) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">📈 Yearly Spending Trend</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const data = yearlyTrend?.data || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">📈 Yearly Spending Trend</h3>
          <p className="text-sm text-gray-600 mt-1">Monthly spending pattern for {selectedYear}</p>
        </div>
        
        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No spending data available for {selectedYear}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value) => [`₹${value.toFixed(2)}`, 'Spent']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="total_spent" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorSpent)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">TOTAL SPENT</p>
              <p className="text-2xl font-bold text-purple-900">
                ₹{data.reduce((sum, item) => sum + item.total_spent, 0).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">AVERAGE/MONTH</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{(data.reduce((sum, item) => sum + item.total_spent, 0) / data.length).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold mb-1">PEAK MONTH</p>
              <p className="text-2xl font-bold text-green-900">
                {data.reduce((max, item) => item.total_spent > max.total_spent ? item : max, data[0]).month}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default YearlyTrendChart;