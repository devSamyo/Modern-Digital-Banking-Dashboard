import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const TopMerchantsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">🏪 Top 5 Merchants</h3>
        <div className="text-center py-12 text-gray-500">
          No merchant data available
        </div>
      </div>
    );
  }

  // Add rank to data
  const rankedData = data.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🏪 Top 5 Merchants</h3>
      <p className="text-sm text-gray-600 mb-4">Your biggest spending destinations</p>
      
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={rankedData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <YAxis 
            dataKey="merchant" 
            type="category" 
            width={90}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value, name, props) => [
              `₹${value.toFixed(2)} (${props.payload.transaction_count} transactions)`,
              'Total Spent'
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px'
            }}
          />
          <Bar dataKey="total_spent" radius={[0, 8, 8, 0]}>
            {rankedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leaderboard Table */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">🏆 Merchant Leaderboard</p>
        <div className="space-y-2">
          {rankedData.map((merchant, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-amber-600' :
                'bg-blue-500'
              }`}>
                {index + 1}
              </div>

              {/* Merchant Name */}
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{merchant.merchant}</p>
                <p className="text-xs text-gray-500">
                  {merchant.transaction_count} transaction{merchant.transaction_count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="font-bold text-gray-800">₹{merchant.total_spent.toFixed(2)}</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="h-1.5 rounded-full"
                    style={{ 
                      width: `${(merchant.total_spent / rankedData[0].total_spent) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopMerchantsChart;