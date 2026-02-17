import { useState } from 'react';
import toast from 'react-hot-toast';
import AccountForm from './AccountForm';
import Modal from '../common/Modal';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const AccountsList = ({ accounts, loading, onReload, onViewTransactions, onViewBudgets, onViewBills }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      await api.delete(API_ENDPOINTS.ACCOUNT_BY_ID(accountToDelete.id));
      toast.success('Account deleted successfully!');
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
      onReload();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
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

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
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
      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">Total Balance</p>
            <h2 className="text-4xl font-bold mt-1">₹{getTotalBalance().toFixed(2)}</h2>
            <p className="text-sm mt-2 opacity-75">{accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingAccount(null);
            }}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-medium transition-colors"
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Accounts Section - Full Width */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Your Account(s)</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">{account.bank_name}</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Account Type:</span>
                    <span className="font-medium text-gray-800">{account.account_type}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Account No:</span>
                    <span className="font-medium text-gray-800">{account.masked_account}</span>
                  </p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="flex justify-between items-center">
                      <span className="text-gray-600">Balance:</span>
                      <span className="text-xl font-bold text-blue-600">₹{account.balance}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(account)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(account)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => onViewTransactions(account.id)}
                  className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors font-medium mt-2"
                >
                  View Transactions
                </button>
              </div>
            </div>
          ))}
        </div>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Delete Account"
      >
        {accountToDelete && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Are you sure you want to delete this account?
              </p>
              <p className="text-sm text-red-700">
                Bank: <strong>{accountToDelete.bank_name}</strong>
              </p>
              <p className="text-sm text-red-700">
                Account: <strong>{accountToDelete.masked_account}</strong>
              </p>
              <p className="text-sm text-red-700">
                Balance: <strong>₹{accountToDelete.balance}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-600">
              This action cannot be undone. All transactions associated with this account will also be deleted.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={handleDeleteCancel}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default AccountsList;