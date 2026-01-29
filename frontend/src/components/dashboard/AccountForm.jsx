import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const AccountForm = ({ account = null, onSuccess, onCancel }) => {
  const isEditing = !!account;
  
  const [formData, setFormData] = useState({
    bank_name: account?.bank_name || '',
    account_type: account?.account_type || '',
    masked_account: account?.masked_account || '',
    currency: account?.currency || '',
    balance: account?.balance || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      currency: formData.currency.toUpperCase(),
      balance: parseFloat(formData.balance),
    };

    try {
      if (isEditing) {
        await api.put(API_ENDPOINTS.ACCOUNT_BY_ID(account.id), payload);
        toast.success('Account updated successfully!');
      } else {
        await api.post(API_ENDPOINTS.ACCOUNTS, payload);
        toast.success('Account created successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(error.response?.data?.detail || 'Failed to save account');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bank Name:
          </label>
          <input
            type="text"
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type:
          </label>
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Account Type</option>
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="credit_card">Credit Card</option>
            <option value="loan">Loan</option>
            <option value="investment">Investment</option>
          </select>
        </div>

        {/* Masked Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Masked Account Number:
          </label>
          <input
            type="text"
            name="masked_account"
            value={formData.masked_account}
            onChange={handleChange}
            placeholder="XXXX1234"
            required
            minLength={4}
            maxLength={12}
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

        {/* Balance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Balance:
          </label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium transition-colors"
          >
            {isEditing ? 'Update Account' : 'Create Account'}
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

export default AccountForm;