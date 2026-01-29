import { useState } from 'react';
import toast from 'react-hot-toast';
import AccountForm from './AccountForm';
import Modal from '../common/Modal';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const AccountsList = ({ accounts, loading, onReload, onViewTransactions }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(API_ENDPOINTS.ACCOUNT_BY_ID(accountId));
      toast.success('Account deleted successfully!');
      onReload();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    onReload();
  };

  const handleEditSuccess = () => {
    setEditingAccount(null);
    onReload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Account(s)</h2>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingAccount(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm transition-colors"
        >
          + Create New Account
        </button>
      </div>

      {/* No accounts message */}
      {accounts.length === 0 && !showCreateForm && !editingAccount && (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-gray-600 text-lg mb-4">
            You don't have any accounts yet. Create your account to get started!
          </p>
        </div>
      )}

      {/* Accounts list */}
      <div className="space-y-3 mb-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white p-4 rounded shadow"
          >
            <div className="mb-3">
              <p>• <strong>User-Id:</strong> {account.id}</p>
              <p>• <strong>Bank:</strong> {account.bank_name}</p>
              <p>• <strong>A/c Type:</strong> {account.account_type}</p>
              <p>• <strong>A/c no.:</strong> {account.masked_account}</p>
              <p>• <strong>Balance:</strong> ₹{account.balance}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleEdit(account)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => onViewTransactions(account.id)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              >
                View Transactions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create form in modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Account"
      >
        <AccountForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>

      {/* Edit form in modal */}
      <Modal
        isOpen={!!editingAccount}
        onClose={handleCancelEdit}
        title="Edit Account"
      >
        {editingAccount && (
          <AccountForm
            account={editingAccount}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        )}
      </Modal>
    </section>
  );
};

export default AccountsList;