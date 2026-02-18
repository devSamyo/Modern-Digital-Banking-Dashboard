import { useState, useEffect } from 'react';
import { useInsights } from '../../hooks/useInsights';
import MonthlyCashFlowChart from './MonthlyCashFlowChart';
import CategorySpendingChart from './CategorySpendingChart';
import TopMerchantsChart from './TopMerchantsChart';
import YearlyTrendChart from './YearlyTrendChart';

const Insights = () => {
  const { insights, loading, fetchInsights } = useInsights();
  const [months, setMonths] = useState(6);

  useEffect(() => {
    fetchInsights(months);
  }, [months]);

  if (loading && !insights) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">📊 Financial Insights</h2>
          <p className="text-gray-600 mt-2">Analyze your spending patterns and financial trends</p>
        </div>
        
        {/* Time Period Selector */}
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
        >
          <option value={1}>Last Month</option>
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      </div>

      {/* Summary Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Burn Rate */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Monthly Burn Rate</p>
              <span className="text-2xl">
                {insights.burn_rate.trend === 'increasing' ? '📈' : 
                 insights.burn_rate.trend === 'decreasing' ? '📉' : '➡️'}
              </span>
            </div>
            <p className="text-3xl font-bold">
              ₹{insights.burn_rate.average_monthly_spending.toLocaleString()}
            </p>
            <p className="text-xs mt-2 opacity-75 capitalize">
              Trend: {insights.burn_rate.trend}
            </p>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total Transactions</p>
              <span className="text-2xl">💳</span>
            </div>
            <p className="text-3xl font-bold">{insights.total_transactions}</p>
            <p className="text-xs mt-2 opacity-75">Over {months} month{months !== 1 ? 's' : ''}</p>
          </div>

          {/* Categories Tracked */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Categories</p>
              <span className="text-2xl">📁</span>
            </div>
            <p className="text-3xl font-bold">{insights.category_spending.length}</p>
            <p className="text-xs mt-2 opacity-75">Spending categories</p>
          </div>

          {/* Top Merchant */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Top Merchant</p>
              <span className="text-2xl">🏪</span>
            </div>
            <p className="text-lg font-bold truncate">
              {insights.top_merchants.length > 0 ? insights.top_merchants[0].merchant : 'N/A'}
            </p>
            <p className="text-xs mt-2 opacity-75">
              {insights.top_merchants.length > 0 
                ? `₹${insights.top_merchants[0].total_spent.toFixed(2)}`
                : 'No data'
              }
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {insights && (
        <div className="space-y-8">
          {/* Monthly Cash Flow - Full Width */}
          <MonthlyCashFlowChart data={insights.monthly_cash_flow} />
          
          {/* Category & Merchants - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySpendingChart data={insights.category_spending} />
            <TopMerchantsChart data={insights.top_merchants} />
          </div>

          {/* Yearly Trend - Full Width */}
          <YearlyTrendChart />
        </div>
      )}

      {/* No Data State */}
      {!loading && !insights && (
        <div className="bg-white p-12 rounded-xl shadow text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">No insights data available</p>
          <p className="text-gray-500 text-sm mt-2">
            Start adding transactions to see your financial insights
          </p>
        </div>
      )}
    </div>
  );
};

export default Insights;