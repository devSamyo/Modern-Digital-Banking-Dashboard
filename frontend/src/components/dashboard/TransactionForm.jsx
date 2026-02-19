import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const TransactionForm = ({ accountId, onSuccess, onCancel }) => {
  // Get current date and time in local format for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    merchant: '',
    description: '',
    amount: '',
    currency: 'INR',
    txn_type: '',
    txn_date: getCurrentDateTime(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert datetime-local to ISO format
    const txnDate = new Date(formData.txn_date).toISOString();

    const payload = {
      account_id: parseInt(accountId),
      merchant: formData.merchant || null,
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency.toUpperCase(),
      txn_type: formData.txn_type,
      txn_date: txnDate,
    };

    try {
      await api.post(API_ENDPOINTS.TRANSACTIONS, payload);
      toast.success('Transaction added successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.response?.data?.detail || 'Failed to add transaction');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Date & Time:
          </label>
          <input
            type="datetime-local"
            name="txn_date"
            value={formData.txn_date}
            onChange={handleChange}
            required
            max={getCurrentDateTime()}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">When did this transaction occur?</p>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant:
          </label>
          <input
            type="text"
            name="merchant"
            value={formData.merchant}
            onChange={handleChange}
            placeholder="e.g., Amazon, Starbucks (Optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description:
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Grocery shopping, Movie tickets"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount:
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency (3 letters):
          </label>
          <input
            type="text"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            placeholder="INR"
            required
            minLength={3}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type:
          </label>
          <select
            name="txn_type"
            value={formData.txn_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="debit">💸 Debit (Money Out)</option>
            <option value="credit">💰 Credit (Money In)</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Category will be automatically assigned based on merchant and description.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium transition-colors"
          >
            Add Transaction
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;