import { useState } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../config';
import toast from 'react-hot-toast';

/**
 * Custom hook for reward management
 */
export const useRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all rewards for the logged-in user
   */
  const fetchRewards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.REWARDS);
      setRewards(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError(err.message);
      toast.error('Failed to load rewards');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch rewards summary with currency conversions
   */
  const fetchRewardsSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_ENDPOINTS.REWARDS_SUMMARY);
      setSummary(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching rewards summary:', err);
      setError(err.message);
      toast.error('Failed to load rewards summary');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new reward program
   */
  const createReward = async (rewardData) => {
    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.REWARDS, rewardData);
      toast.success(`Reward program "${rewardData.program_name}" created!`);
      return response.data;
    } catch (err) {
      console.error('Error creating reward:', err);
      toast.error(err.response?.data?.detail || 'Failed to create reward program');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing reward program
   */
  const updateReward = async (rewardId, updateData) => {
    try {
      setLoading(true);
      const response = await api.put(API_ENDPOINTS.REWARD_BY_ID(rewardId), updateData);
      toast.success('Reward program updated successfully!');
      return response.data;
    } catch (err) {
      console.error('Error updating reward:', err);
      toast.error(err.response?.data?.detail || 'Failed to update reward program');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a reward program
   */
  const deleteReward = async (rewardId) => {
    try {
      setLoading(true);
      await api.delete(API_ENDPOINTS.REWARD_BY_ID(rewardId));
      toast.success('Reward program deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting reward:', err);
      toast.error('Failed to delete reward program');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add or deduct points from a reward program
   */
  const addPoints = async (rewardId, points) => {
    try {
      setLoading(true);
      const response = await api.post(
        API_ENDPOINTS.ADD_POINTS(rewardId),
        null,
        { params: { points } }
      );
      
      const action = points > 0 ? 'added' : 'deducted';
      toast.success(`${Math.abs(points)} points ${action} successfully!`);
      return response.data;
    } catch (err) {
      console.error('Error updating points:', err);
      toast.error(err.response?.data?.detail || 'Failed to update points');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    rewards,
    summary,
    loading,
    error,
    fetchRewards,
    fetchRewardsSummary,
    createReward,
    updateReward,
    deleteReward,
    addPoints,
  };
};