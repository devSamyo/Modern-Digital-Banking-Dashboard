import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyCashFlowChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-4">💰 Monthly Cash Flow</h3>
        <div className="text-center py-12 text-gray-500">
          No cash flow data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Monthly Cash Flow</h3>
      <p className="text-sm text-gray-600 mb-4">Track your income, expenses, and net savings over time</p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }} barCategoryGap="20%" barGap={4}>
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
            formatter={(value, name) => [`₹${value.toFixed(2)}`, name]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="total_credits" name="Credits (Income)" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="total_debits" name="Debits (Expenses)" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="net_savings" name="Net Savings" radius={[4, 4, 0, 0]}
            fill="#3b82f6"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Legend */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Credits: Money received</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Debits: Money spent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Net: Credits - Debits</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCashFlowChart;