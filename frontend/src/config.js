// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Accounts
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTIONS_BY_ACCOUNT: (accountId) => `/accounts/${accountId}/transactions`,
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  UPDATE_TRANSACTION_CATEGORY: (id) => `/transactions/${id}/category`,
  EXPORT_TRANSACTIONS_CSV: (accountId) => `/accounts/${accountId}/transactions/export`,
  IMPORT_TRANSACTIONS_CSV: (accountId) => `/accounts/${accountId}/transactions/import`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_RULES: '/categories/rules',
  RECATEGORIZE_ALL: '/categories/recategorize-all',
  RECATEGORIZE_TRANSACTION: (id) => `/categories/recategorize-transaction/${id}`,
  
  // Budgets
  BUDGETS: '/budgets',
  BUDGETS_WITH_SPENDING: '/budgets/with-spending',
  BUDGET_BY_ID: (id) => `/budgets/${id}`,
  BUDGET_WITH_SPENDING_BY_ID: (id) => `/budgets/${id}/with-spending`,
  EXPORT_BUDGETS_CSV: '/budgets/export',
  
  // Bills
  BILLS: '/bills',
  BILL_BY_ID: (id) => `/bills/${id}`,
  MARK_BILL_PAID: (id) => `/bills/${id}/mark-paid`,
  BILLS_UPCOMING_SUMMARY: '/bills/upcoming/summary',
  SEND_REMINDERS: '/bills/send-reminders',
  
  // Rewards
  REWARDS: '/rewards',
  REWARD_BY_ID: (id) => `/rewards/${id}`,
  REWARDS_SUMMARY: '/rewards/summary',
  ADD_POINTS: (id) => `/rewards/${id}/add-points`,
  EXCHANGE_RATES: '/rewards/currency/rates',
  REFRESH_RATES: '/rewards/currency/refresh',
  
  // Insights
  INSIGHTS_SUMMARY: '/insights/summary',
  INSIGHTS_YEARLY_TREND: '/insights/yearly-trend',
  
  // Alerts
  ALERTS: '/alerts',
  ALERTS_SUMMARY: '/alerts/summary',
  ALERT_MARK_READ: (id) => `/alerts/${id}/mark-read`,
  ALERTS_MARK_ALL_READ: '/alerts/mark-all-read',
  ALERT_DELETE: (id) => `/alerts/${id}`,

  // Reports
  REPORT_MONTHLY_SUMMARY: '/reports/monthly-summary',
  REPORT_CATEGORY_BREAKDOWN: '/reports/category-breakdown',
};