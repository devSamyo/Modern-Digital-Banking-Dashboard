import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import toast from 'react-hot-toast';
import BudgetSummary from '../budgets/BudgetSummary';
import BillsSummary from '../bills/BillsSummary';

const DashboardOverview = ({ onViewBudgets, onViewBills, onViewAccounts, onViewRewards }) => {
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    totalBudgets: 0,
    totalBills: 0,
    overdueBills: 0,
    totalRewards: 0,
    totalRewardPoints: 0,
    totalRewardValueINR: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch accounts
      const accountsResponse = await api.get(API_ENDPOINTS.ACCOUNTS);
      const accounts = accountsResponse.data;
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

      // Fetch budgets and filter for current month
      const budgetsResponse = await api.get(API_ENDPOINTS.BUDGETS);
      const allBudgets = budgetsResponse.data;
      
      // Get current month as number (1-12)
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = now.getFullYear();
      
      console.log('Current month (number):', currentMonth);
      console.log('Current year:', currentYear);
      console.log('All budgets:', allBudgets);
      
      // Filter budgets for current month
      // Your backend stores month as a NUMBER (1-12), not a string
      const currentMonthBudgets = allBudgets.filter(budget => {
        // Check if budget.month matches current month number
        const isCurrentMonth = budget.month === currentMonth;
        console.log(`Budget month: ${budget.month}, Current: ${currentMonth}, Match: ${isCurrentMonth}`);
        return isCurrentMonth;
      });
      
      console.log('Filtered current month budgets:', currentMonthBudgets);
      console.log('Current month budget count:', currentMonthBudgets.length);

      // Fetch bills
      const billsResponse = await api.get(API_ENDPOINTS.BILLS);
      const bills = billsResponse.data;
      const unpaidBills = bills.filter(b => b.status !== 'paid');
      const overdueBills = bills.filter(b => b.status === 'overdue');

      // Fetch rewards
      try {
        const rewardsResponse = await api.get(API_ENDPOINTS.REWARDS_SUMMARY);
        const rewards = rewardsResponse.data;
        
        setStats({
          totalAccounts: accounts.length,
          totalBalance: totalBalance,
          totalBudgets: currentMonthBudgets.length, // Only current month budgets
          totalBills: unpaidBills.length,
          overdueBills: overdueBills.length,
          totalRewards: rewards.total_programs || 0,
          totalRewardPoints: rewards.total_points || 0,
          totalRewardValueINR: rewards.total_value_inr || 0,
        });
      } catch (rewardError) {
        // If rewards fails, still show other stats
        setStats({
          totalAccounts: accounts.length,
          totalBalance: totalBalance,
          totalBudgets: currentMonthBudgets.length, // Only current month budgets
          totalBills: unpaidBills.length,
          overdueBills: overdueBills.length,
          totalRewards: 0,
          totalRewardPoints: 0,
          totalRewardValueINR: 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get current month name for display
  const getCurrentMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back! Here's your financial summary for {getCurrentMonthName()} {new Date().getFullYear()}</p>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Balance */}
        <div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onViewAccounts}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💰</div>
            <div className="text-xs bg-blue-700 bg-opacity-50 px-2 py-1 rounded">Accounts</div>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Balance</p>
          <p className="text-3xl font-bold">₹{stats.totalBalance.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-2">{stats.totalAccounts} account{stats.totalAccounts !== 1 ? 's' : ''}</p>
        </div>

        {/* Budgets - Current Month Only */}
        <div 
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onViewBudgets}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💵</div>
            <div className="text-xs bg-green-700 bg-opacity-50 px-2 py-1 rounded">{getCurrentMonthName()}</div>
          </div>
          <p className="text-sm opacity-90 mb-1">Active Budgets</p>
          <p className="text-3xl font-bold">{stats.totalBudgets}</p>
          <p className="text-xs opacity-75 mt-2">This month's budgets</p>
        </div>

        {/* Bills */}
        <div 
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onViewBills}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📄</div>
            <div className="text-xs bg-orange-700 bg-opacity-50 px-2 py-1 rounded">Bills</div>
          </div>
          <p className="text-sm opacity-90 mb-1">Pending Bills</p>
          <p className="text-3xl font-bold">{stats.totalBills}</p>
          {stats.overdueBills > 0 && (
            <p className="text-xs mt-2 bg-red-500 bg-opacity-50 px-2 py-1 rounded inline-block">
              ⚠️ {stats.overdueBills} overdue
            </p>
          )}
          {stats.overdueBills === 0 && stats.totalBills > 0 && (
            <p className="text-xs opacity-75 mt-2">All current</p>
          )}
          {stats.totalBills === 0 && (
            <p className="text-xs opacity-75 mt-2">No pending bills</p>
          )}
        </div>

        {/* Rewards */}
        <div 
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onViewRewards}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🎁</div>
            <div className="text-xs bg-purple-700 bg-opacity-50 px-2 py-1 rounded">Rewards</div>
          </div>
          <p className="text-sm opacity-90 mb-1">Reward Programs</p>
          <p className="text-3xl font-bold">{stats.totalRewards}</p>
          <p className="text-xs opacity-75 mt-2">
            {stats.totalRewardPoints > 0 
              ? `${stats.totalRewardPoints.toLocaleString()} points`
              : 'No programs yet'
            }
          </p>
        </div>
      </div>

      {/* Reward Value Card (if rewards exist) */}
      {stats.totalRewardPoints > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Reward Points Value</p>
              <p className="text-4xl font-bold">₹{stats.totalRewardValueINR.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-2">{stats.totalRewardPoints.toLocaleString()} total points</p>
            </div>
            <div className="text-6xl">💎</div>
          </div>
        </div>
      )}

      {/* Grid Layout: Budget Summary + Bills Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetSummary onViewAll={onViewBudgets} />
        <BillsSummary onViewAll={onViewBills} />
      </div>
    </div>
  );
};

export default DashboardOverview;