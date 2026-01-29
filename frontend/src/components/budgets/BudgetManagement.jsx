import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    category: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    limit_amount: ''
  });
  const [updateLimit, setUpdateLimit] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadCategories();
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const loadCategories = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.BUDGETS_WITH_SPENDING, {
        params: { month: selectedMonth, year: selectedYear }
      });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();

    const payload = {
      category: formData.category,
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      limit_amount: parseFloat(formData.limit_amount)
    };

    try {
      await api.post(API_ENDPOINTS.BUDGETS, payload);
      toast.success('Budget created successfully!');
      setShowCreateForm(false);
      setFormData({
        category: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        limit_amount: ''
      });
      loadBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error(error.response?.data?.detail || 'Failed to create budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await api.delete(API_ENDPOINTS.BUDGET_BY_ID(budgetId));
      toast.success('Budget deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedBudget(null);
      loadBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    
    if (!updateLimit || parseFloat(updateLimit) <= 0) {
      toast.error('Please enter a valid budget limit');
      return;
    }

    try {
      await api.put(API_ENDPOINTS.BUDGET_BY_ID(selectedBudget.id), {
        limit_amount: parseFloat(updateLimit)
      });
      toast.success('Budget updated successfully!');
      setShowUpdateForm(false);
      setSelectedBudget(null);
      setUpdateLimit('');
      loadBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getBudgetCardStyle = (isOverBudget) => {
    return isOverBudget
      ? 'border-2 border-red-500 bg-red-50'
      : 'border border-gray-200 bg-white';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
        >
          + Create Budget
        </button>
      </div>

      {/* Month/Year Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="font-medium text-gray-700">View Budgets For:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[2024, 2025, 2026, 2027, 2028].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Budget</h3>
          <p className="text-2xl font-bold text-blue-900">
            ₹{budgets.reduce((sum, b) => sum + b.limit_amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800 mb-1">Total Spent</h3>
          <p className="text-2xl font-bold text-purple-900">
            ₹{budgets.reduce((sum, b) => sum + b.spent_amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-1">Total Remaining</h3>
          <p className="text-2xl font-bold text-green-900">
            ₹{budgets.reduce((sum, b) => sum + b.remaining_amount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* No Budgets Message */}
      {budgets.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">
            No budgets found for {months[selectedMonth - 1]} {selectedYear}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create Your First Budget
          </button>
        </div>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((budget) => (
          <div
            key={budget.id}
            className={`rounded-lg shadow-md p-6 ${getBudgetCardStyle(budget.is_over_budget)}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{budget.category}</h3>
                <p className="text-sm text-gray-500">
                  {months[budget.month - 1]} {budget.year}
                </p>
              </div>
              {budget.is_over_budget && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  ⚠️ Over Budget
                </span>
              )}
            </div>

            {/* Budget Info */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget Limit:</span>
                <span className="font-bold text-gray-800">₹{budget.limit_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spent:</span>
                <span className={`font-bold ${budget.is_over_budget ? 'text-red-600' : 'text-gray-800'}`}>
                  ₹{budget.spent_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-bold ${budget.is_over_budget ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{budget.remaining_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Progress</span>
                <span className="text-xs font-bold text-gray-700">
                  {budget.percentage_used.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(budget.percentage_used)}`}
                  style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedBudget(budget);
                  setUpdateLimit(budget.limit_amount.toString());
                  setShowUpdateForm(true);
                }}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-medium"
              >
                Update Limit
              </button>
              <button
                onClick={() => {
                  setSelectedBudget(budget);
                  setShowDeleteConfirm(true);
                }}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Budget"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category:
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month:
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year:
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit (₹):
            </label>
            <input
              type="number"
              value={formData.limit_amount}
              onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
              required
              min="0.01"
              step="0.01"
              placeholder="e.g., 5000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Set realistic budgets based on your spending patterns. You can always adjust them later!
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition-colors"
            >
              Create Budget
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Budget Modal */}
      <Modal
        isOpen={showUpdateForm}
        onClose={() => {
          setShowUpdateForm(false);
          setSelectedBudget(null);
          setUpdateLimit('');
        }}
        title="Update Budget Limit"
      >
        <form onSubmit={handleUpdateBudget} className="space-y-4">
          {selectedBudget && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                <p className="text-sm text-gray-600">Category:</p>
                <p className="text-lg font-bold text-gray-800">{selectedBudget.category}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {months[selectedBudget.month - 1]} {selectedBudget.year}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Limit: ₹{selectedBudget.limit_amount.toFixed(2)}
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                  New Budget Limit (₹):
                </label>
                <input
                  type="number"
                  value={updateLimit}
                  onChange={(e) => setUpdateLimit(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Enter new limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition-colors"
                >
                  Update Budget
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedBudget(null);
                    setUpdateLimit('');
                  }}
                  className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedBudget(null);
        }}
        title="Delete Budget"
      >
        {selectedBudget && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Are you sure you want to delete this budget?
              </p>
              <p className="text-sm text-red-700">
                Category: <strong>{selectedBudget.category}</strong>
              </p>
              <p className="text-sm text-red-700">
                Period: <strong>{months[selectedBudget.month - 1]} {selectedBudget.year}</strong>
              </p>
              <p className="text-sm text-red-700">
                Limit: <strong>₹{selectedBudget.limit_amount.toFixed(2)}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-600">
              This action cannot be undone. The budget will be permanently deleted.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleDeleteBudget(selectedBudget.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Delete Budget
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedBudget(null);
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BudgetManagement;