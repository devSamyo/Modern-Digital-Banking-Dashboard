import { useState } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';
import toast from 'react-hot-toast';

/**
 * Custom hook for insights data
 */
export const useInsights = () => {
  const [insights, setInsights] = useState(null);
  const [yearlyTrend, setYearlyTrend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch insights summary
   */
  const fetchInsights = async (months = 6) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`${API_ENDPOINTS.INSIGHTS_SUMMARY}?months=${months}`);
      setInsights(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err.message);
      toast.error('Failed to load insights', {
        duration: 3000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch yearly trend data
   */
  const fetchYearlyTrend = async (year = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = year 
        ? `${API_ENDPOINTS.INSIGHTS_YEARLY_TREND}?year=${year}`
        : API_ENDPOINTS.INSIGHTS_YEARLY_TREND;
      
      const response = await api.get(url);
      setYearlyTrend(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching yearly trend:', err);
      setError(err.message);
      toast.error('Failed to load yearly trend', {
        duration: 3000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    insights,
    yearlyTrend,
    loading,
    error,
    fetchInsights,
    fetchYearlyTrend,
  };
};