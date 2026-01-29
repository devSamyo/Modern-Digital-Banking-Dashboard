// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me',
  
  // Accounts
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTIONS_BY_ACCOUNT: (accountId) => `/accounts/${accountId}/transactions`,
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  UPDATE_TRANSACTION_CATEGORY: (id) => `/transactions/${id}/category`,
  
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
};