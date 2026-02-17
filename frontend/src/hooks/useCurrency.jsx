import { useState } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';
import toast from 'react-hot-toast';

/**
 * Custom hook for currency conversion and exchange rates
 */
export const useCurrency = () => {
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch current exchange rates
   */
  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.EXCHANGE_RATES);
      setExchangeRates(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError(err.message);
      toast.error('Failed to load exchange rates');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Force refresh exchange rates from API
   */
  const refreshExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.REFRESH_RATES);
      setExchangeRates(null); // Clear old rates
      
      toast.success('Exchange rates refreshed successfully!', {
        icon: '💱',
        duration: 3000,
      });
      
      // Fetch new rates
      await fetchExchangeRates();
      
      return response.data;
    } catch (err) {
      console.error('Error refreshing exchange rates:', err);
      toast.error('Failed to refresh exchange rates');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format currency value with symbol
   */
  const formatCurrency = (amount, currency = 'INR') => {
    const symbols = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  return {
    exchangeRates,
    loading,
    error,
    fetchExchangeRates,
    refreshExchangeRates,
    formatCurrency,
  };
};