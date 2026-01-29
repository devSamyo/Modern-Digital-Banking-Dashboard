import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const TransactionForm = ({ accountId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    merchant: '',
    description: '',
    amount: '',
    currency: '',
    txn_type: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      account_id: parseInt(accountId),
      merchant: formData.merchant || null,
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency.toUpperCase(),
      txn_type: formData.txn_type,
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
            placeholder="Optional"
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
            required
            min="0"
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
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
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