import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../common/Header';
import AccountsList from './AccountsList';
import TransactionsView from './TransactionsView';
import CategoryManagement from '../categories/CategoryManagement';
import BudgetManagement from '../budgets/BudgetManagement';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('accounts'); // 'accounts', 'transactions', 'categories', or 'budgets'
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ACCOUNTS);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransactions = (accountId) => {
    setSelectedAccountId(accountId);
    setCurrentView('transactions');
  };

  const handleBackToAccounts = () => {
    setCurrentView('accounts');
    setSelectedAccountId(null);
    loadAccounts();
  };

  const handleViewCategories = () => {
    setCurrentView('categories');
  };

  const handleBackFromCategories = () => {
    setCurrentView('accounts');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Modern Digital Banking" showLogout={true} />
      
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-4">
            <button
              onClick={() => {
                setCurrentView('accounts');
                setSelectedAccountId(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'accounts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Accounts
            </button>
            <button
              onClick={() => setCurrentView('categories')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'categories'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏷️ Category Rules
            </button>
            <button
              onClick={() => setCurrentView('budgets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'budgets'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Budgets
            </button>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'accounts' && (
          <AccountsList
            accounts={accounts}
            loading={loading}
            onReload={loadAccounts}
            onViewTransactions={handleViewTransactions}
          />
        )}

        {currentView === 'transactions' && (
          <TransactionsView
            accountId={selectedAccountId}
            onBack={handleBackToAccounts}
            onBalanceChange={loadAccounts}
          />
        )}

        {currentView === 'categories' && (
          <CategoryManagement />
        )}

        {currentView === 'budgets' && (
          <BudgetManagement />
        )}
      </main>
    </div>
  );
};

export default Dashboard;