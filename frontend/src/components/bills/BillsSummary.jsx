import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const BillsSummary = ({ onViewAll }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillsSummary();
  }, []);

  const loadBillsSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.BILLS_UPCOMING_SUMMARY);
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading bills summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysMessage = (daysUntilDue) => {
    if (daysUntilDue === 0) return 'Due today!';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `${daysUntilDue} days`;
  };

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

  if (!summary || (summary.upcoming_count === 0 && summary.overdue_count === 0)) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">📄 Bills Overview</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No upcoming or overdue bills</p>
          <button
            onClick={onViewAll}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Manage Bills
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">📄 Bills Overview</h3>
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Upcoming</p>
          <p className="text-xl font-bold text-blue-900">{summary.upcoming_count}</p>
          <p className="text-xs text-blue-600 mt-1">₹{summary.upcoming_amount.toFixed(0)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-red-600 font-medium">Overdue</p>
          <p className="text-xl font-bold text-red-900">{summary.overdue_count}</p>
          <p className="text-xs text-red-600 mt-1">₹{summary.overdue_amount.toFixed(0)}</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {summary.overdue_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ {summary.overdue_count} {summary.overdue_count === 1 ? 'bill is' : 'bills are'} overdue!
          </p>
        </div>
      )}

      {/* Upcoming Bills List */}
      {summary.upcoming_bills.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">Due Soon</p>
          {summary.upcoming_bills.slice(0, 3).map((bill) => (
            <div key={bill.id} className="border-l-4 border-blue-400 pl-3 py-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{bill.biller_name}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(bill.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{bill.amount_due.toFixed(0)}</p>
                  <span className={`text-xs font-medium ${
                    bill.days_until_due <= 3 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {getDaysMessage(bill.days_until_due)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue Bills List */}
      {summary.overdue_bills.length > 0 && (
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-red-600 uppercase">Overdue</p>
          {summary.overdue_bills.slice(0, 2).map((bill) => (
            <div key={bill.id} className="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{bill.biller_name}</p>
                  <p className="text-xs text-red-600">
                    {bill.days_overdue} {bill.days_overdue === 1 ? 'day' : 'days'} overdue
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-900">₹{bill.amount_due.toFixed(0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {(summary.upcoming_bills.length > 3 || summary.overdue_bills.length > 2) && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button
            onClick={onViewAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View {summary.upcoming_count + summary.overdue_count} bills →
          </button>
        </div>
      )}
    </div>
  );
};

export default BillsSummary;