import { useState } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';
import toast from 'react-hot-toast';

/**
 * Custom hook for alerts management
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all alerts
   */
  const fetchAlerts = async (unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const url = unreadOnly 
        ? `${API_ENDPOINTS.ALERTS}?unread_only=true`
        : API_ENDPOINTS.ALERTS;
      
      const response = await api.get(url);
      setAlerts(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      toast.error('Failed to load alerts', {
        duration: 3000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch alerts summary with unread count
   */
  const fetchAlertsSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.ALERTS_SUMMARY);
      setSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching alerts summary:', err);
      setError(err.message);
      toast.error('Failed to load alerts summary', {
        duration: 3000,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark a specific alert as read
   */
  const markAsRead = async (alertId) => {
    try {
      setLoading(true);
      await api.put(API_ENDPOINTS.ALERT_MARK_READ(alertId));
      
      toast.success('Alert marked as read', {
        duration: 2000,
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, read_status: true } : alert
      ));
      
      return true;
    } catch (err) {
      console.error('Error marking alert as read:', err);
      toast.error('Failed to mark alert as read', {
        duration: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark all alerts as read
   */
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await api.put(API_ENDPOINTS.ALERTS_MARK_ALL_READ);
      
      toast.success(response.data.message || 'All alerts marked as read', {
        duration: 2000,
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => ({ ...alert, read_status: true })));
      
      return true;
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
      toast.error('Failed to mark all alerts as read', {
        duration: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an alert
   */
  const deleteAlert = async (alertId) => {
    try {
      setLoading(true);
      await api.delete(API_ENDPOINTS.ALERT_DELETE(alertId));
      
      toast.success('Alert deleted', {
        duration: 2000,
      });
      
      // Update local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      return true;
    } catch (err) {
      console.error('Error deleting alert:', err);
      toast.error('Failed to delete alert', {
        duration: 3000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    alerts,
    summary,
    loading,
    error,
    fetchAlerts,
    fetchAlertsSummary,
    markAsRead,
    markAllAsRead,
    deleteAlert,
  };
};