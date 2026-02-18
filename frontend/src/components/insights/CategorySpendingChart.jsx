import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CategorySpendingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">📊 Category Distribution</h3>
        <div className="text-center py-12 text-gray-500">
          No category spending data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Category Distribution</h3>
      <p className="text-sm text-gray-600 mb-4">Where your money goes</p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="category"
            angle={0}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            // height={70}
            tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}…` : value}
          />
          <YAxis
            tickFormatter={(value) => `₹${value}`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip
            formatter={(value, name, props) => [
              `₹${value.toFixed(2)} (${props.payload.percentage.toFixed(1)}%)`,
              name
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px'
            }}
          />
          <Bar dataKey="total_spent" name="Total Spent" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Top 3 Categories */}
      <div className="mt-6 space-y-2">
        <p className="text-sm font-semibold text-gray-700 mb-2">Top Spending Categories:</p>
        {data.slice(0, 3).map((category, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-gray-700">{category.category}</span>
            </div>
            <span className="font-semibold text-gray-800">
              ₹{category.total_spent.toFixed(2)} ({category.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySpendingChart;