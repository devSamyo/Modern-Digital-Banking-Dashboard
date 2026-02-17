import { useState } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';
import toast from 'react-hot-toast';

/**
 * Custom hook for bill reminder functionality
 * Fetches pending bills summary and provides manual reminder trigger
 */
export const useBillReminder = () => {
  const [billsSummary, setBillsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch bills summary (upcoming + overdue)
   */
  const fetchBillsSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.BILLS_UPCOMING_SUMMARY, {
        params: { days: 7 } // Get bills due in next 7 days
      });
      setBillsSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching bills summary:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manually trigger bill reminders with improved user feedback
   */
  const sendReminders = async (daysAhead = 3) => {
    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.SEND_REMINDERS, null, {
        params: { days_ahead: daysAhead }
      });
      
      const count = response.data.result?.total_sent || 0;
      
      // Show different messages based on reminder count
      if (count > 0) {
        toast.success(
          `✅ Reminders sent successfully! ${count} reminder${count !== 1 ? 's' : ''} processed.`,
          { 
            duration: 4000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          }
        );
      } else {
        toast(
          '📧 All pending bills have already been reminded. No new reminders to send.',
          { 
            duration: 5000,
            icon: 'ℹ️',
            style: {
              background: '#162845',
              color: '#fff',
            },
          }
        );
      }
      
      return response.data;
    } catch (err) {
      console.error('Error sending reminders:', err);
      toast.error('❌ Failed to send reminders. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has any pending bills
   */
  const hasPendingBills = () => {
    if (!billsSummary) return false;
    return (billsSummary.upcoming_count > 0 || billsSummary.overdue_count > 0);
  };

  return {
    billsSummary,
    loading,
    error,
    fetchBillsSummary,
    sendReminders,
    hasPendingBills,
  };
};