import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const BudgetSummary = ({ onViewAll }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overBudgetCount: 0
  });

  useEffect(() => {
    loadBudgetSummary();
  }, []);

  const loadBudgetSummary = async () => {
    try {
      setLoading(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const response = await api.get(API_ENDPOINTS.BUDGETS_WITH_SPENDING, {
        params: { month: currentMonth, year: currentYear }
      });
      
      const budgetData = response.data;
      setBudgets(budgetData.slice(0, 3)); // Show top 3

      // Calculate summary
      const totalBudget = budgetData.reduce((sum, b) => sum + b.limit_amount, 0);
      const totalSpent = budgetData.reduce((sum, b) => sum + b.spent_amount, 0);
      const totalRemaining = budgetData.reduce((sum, b) => sum + b.remaining_amount, 0);
      const overBudgetCount = budgetData.filter(b => b.is_over_budget).length;

      setSummary({ totalBudget, totalSpent, totalRemaining, overBudgetCount });
    } catch (error) {
      console.error('Error loading budget summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">💰 Budget Overview</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No budgets set for {currentMonth} {currentYear}</p>
          <button
            onClick={onViewAll}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Create Budget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">💰 Budget Overview</h3>
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{currentMonth} {currentYear}</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Total Budget</p>
          <p className="text-xl font-bold text-blue-900">₹{summary.totalBudget.toFixed(0)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium">Total Spent</p>
          <p className="text-xl font-bold text-purple-900">₹{summary.totalSpent.toFixed(0)}</p>
        </div>
      </div>

      {/* Overall Progress */}
      {/* <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Limit</span>
          <span className="text-sm font-bold text-gray-800">
            {summary.totalBudget > 0 ? ((summary.totalSpent / summary.totalBudget) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressBarColor(
              summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0
            )}`}
            style={{
              width: `${Math.min(summary.totalBudget > 0 ? (summary.totalSpent / summary.totalBudget) * 100 : 0, 100)}%`
            }}
          ></div>
        </div>
      </div> */}

      {/* Over Budget Alert */}
      {summary.overBudgetCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            ⚠️ <strong>{summary.overBudgetCount}</strong> {summary.overBudgetCount === 1 ? 'budget is' : 'budgets are'} over limit!
          </p>
        </div>
      )}

      {/* Top 3 Budgets */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase">Top Categories</p>
        {budgets.map((budget) => (
          <div key={budget.id} className="border-l-4 border-gray-200 pl-3">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-gray-800">{budget.category}</span>
              {budget.is_over_budget && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  Over
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">
                ₹{budget.spent_amount.toFixed(0)} / ₹{budget.limit_amount.toFixed(0)}
              </span>
              <span className="text-xs font-bold text-gray-700">
                {budget.percentage_used.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressBarColor(budget.percentage_used)}`}
                style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-600">
        <span>Remaining: <strong className="text-green-600">₹{summary.totalRemaining.toFixed(0)}</strong></span>
        <span>{budgets.length > 3 ? `+${budgets.length - 3} more` : ''}</span>
      </div>
    </div>
  );
};

export default BudgetSummary;