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
import AlertsCenter from '../alerts/AlertsCenter';
import ReportsCenter from '../reports/ReportsCenter';
import BillReminderNotification from '../bills/BillReminderNotification';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';

const Dashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    loadAccounts();
    loadUnreadAlertsCount();

    // Auto-refresh unread alerts count every 30 seconds
    const alertInterval = setInterval(() => {
      loadUnreadAlertsCount();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(alertInterval);
  }, []);

  useEffect(() => {
    if (currentView === 'alerts') {
      loadUnreadAlertsCount();
    }
  }, [currentView]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ACCOUNTS);
      setAccounts(response.data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadAlertsCount = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.ALERTS_SUMMARY);
      const newCount = response.data.unread_count || 0;
      
      // Only show toast if count increased (new alerts)
      if (newCount > unreadAlertsCount && unreadAlertsCount > 0) {
        toast('You have new alerts!', {
          icon: '🔔',
          duration: 3000,
        });
      }
      
      setUnreadAlertsCount(newCount);
    } catch (error) {
      console.error('Error loading unread alerts count:', error);
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

  const handleViewBudgets = () => setCurrentView('budgets');
  const handleViewBills = () => setCurrentView('bills');
  const handleViewAccounts = () => setCurrentView('accounts');
  const handleViewRewards = () => setCurrentView('rewards');
  const handleNavigateToBills = () => setCurrentView('bills');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header title="Modern Digital Banking" showLogout={true} />
        <BillReminderNotification onNavigateToBills={handleNavigateToBills} />
      </div>

      {/* Fixed Navigation Tabs */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-4 overflow-x-auto">
            <button
              onClick={() => { setCurrentView('dashboard'); setSelectedAccountId(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => { setCurrentView('accounts'); setSelectedAccountId(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'accounts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Accounts
            </button>
            
            <button
              onClick={() => setCurrentView('categories')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'categories' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏷️ Category Rules
            </button>
            <button
              onClick={() => setCurrentView('budgets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'budgets' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Budgets
            </button>
            <button
              onClick={() => setCurrentView('bills')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'bills' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 Bills
            </button>
            <button
              onClick={() => setCurrentView('rewards')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'rewards' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎁 Rewards
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'reports' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Reports
            </button>
            <button
              onClick={() => setCurrentView('alerts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap relative ${
                currentView === 'alerts' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔔 Alerts
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                currentView === 'profile' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Profile
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
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
          {currentView === 'alerts' && (
            <AlertsCenter onAlertsChange={loadUnreadAlertsCount} />
          )}
          {currentView === 'transactions' && (
            <TransactionsView
              accountId={selectedAccountId}
              onBack={handleBackToAccounts}
              onBalanceChange={loadAccounts}
            />
          )}
          {currentView === 'categories' && <CategoryManagement />}
          {currentView === 'budgets' && <BudgetManagement />}
          {currentView === 'bills' && <BillManagement />}
          {currentView === 'rewards' && <RewardManagement />}
          {currentView === 'reports' && <ReportsCenter />}
          {currentView === 'profile' && <Profile />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;