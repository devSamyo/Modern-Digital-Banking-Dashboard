import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../common/Header';
import DashboardOverview from './DashboardOverview';
import AccountsList from './AccountsList';
import TransactionsView from './TransactionsView';
import CategoryManagement from '../categories/CategoryManagement';
import BudgetManagement from '../budgets/BudgetManagement';
import BillManagement from '../bills/BillManagement';
import RewardManagement from '../rewards/RewardManagement';
import Profile from '../profile/Profile';
import BillReminderNotification from '../bills/BillReminderNotification';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState(null);

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

  const handleViewBudgets = () => {
    setCurrentView('budgets');
  };

  const handleViewBills = () => {
    setCurrentView('bills');
  };

  const handleViewAccounts = () => {
    setCurrentView('accounts');
  };

  const handleViewRewards = () => {
    setCurrentView('rewards');
  };

  const handleNavigateToBills = () => {
    setCurrentView('bills');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Modern Digital Banking" showLogout={true} />
      
      {/* Bill Reminder Notification */}
      <BillReminderNotification onNavigateToBills={handleNavigateToBills} />
      
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-4 overflow-x-auto">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedAccountId(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('accounts');
                setSelectedAccountId(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'accounts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Accounts
            </button>
            <button
              onClick={() => setCurrentView('categories')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'categories'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏷️ Category Rules
            </button>
            <button
              onClick={() => setCurrentView('budgets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'budgets'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Budgets
            </button>
            <button
              onClick={() => setCurrentView('bills')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'bills'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 Bills
            </button>
            <button
              onClick={() => setCurrentView('rewards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'rewards'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎁 Rewards
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'profile'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Profile
            </button>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {currentView === 'dashboard' && (
          <DashboardOverview
            onViewBudgets={handleViewBudgets}
            onViewBills={handleViewBills}
            onViewAccounts={handleViewAccounts}
            onViewRewards={handleViewRewards}
          />
        )}

        {currentView === 'accounts' && (
          <AccountsList
            accounts={accounts}
            loading={loading}
            onReload={loadAccounts}
            onViewTransactions={handleViewTransactions}
            onViewBudgets={handleViewBudgets}
            onViewBills={handleViewBills}
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

        {currentView === 'bills' && (
          <BillManagement />
        )}

        {currentView === 'rewards' && (
          <RewardManagement />
        )}

        {currentView === 'profile' && (
          <Profile />
        )}
      </main>
    </div>
  );
};

export default Dashboard;