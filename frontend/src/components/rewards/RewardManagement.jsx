import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRewards } from '../../hooks/useRewards';
import { useCurrency } from '../../hooks/useCurrency';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const RewardManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState(null);
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  
  // Currency selector state
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('preferredCurrency') || 'USD';
  });
  
  const [formData, setFormData] = useState({
    program_name: '',
    points_balance: '',
    program_type: '',
    conversion_rate: ''
  });

  const { 
    summary, 
    loading, 
    fetchRewardsSummary, 
    createReward, 
    updateReward, 
    deleteReward,
    addPoints: addPointsAPI 
  } = useRewards();

  const { 
    exchangeRates,
    loading: ratesLoading,
    fetchExchangeRates, 
    refreshExchangeRates,
    formatCurrency 
  } = useCurrency();

  useEffect(() => {
    loadRewards();
    loadExchangeRates();
  }, []);

  // Save currency preference
  useEffect(() => {
    localStorage.setItem('preferredCurrency', selectedCurrency);
  }, [selectedCurrency]);

  const loadRewards = async () => {
    await fetchRewardsSummary();
  };

  const loadExchangeRates = async () => {
    await fetchExchangeRates();
  };

  // Currency metadata
  const currencies = {
    USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
    JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  };

  // Get value in selected currency
  const getValueInCurrency = (reward, currency) => {
    const key = `value_${currency.toLowerCase()}`;
    return reward[key] || 0;
  };

  // Get total value in selected currency
  const getTotalValue = (currency) => {
    if (!summary) return 0;
    const key = `total_value_${currency.toLowerCase()}`;
    return summary[key] || 0;
  };

  // Format currency with proper symbol
  const formatValue = (amount, currency) => {
    const currencyInfo = currencies[currency];
    if (!currencyInfo) return amount.toFixed(2);
    
    // Japanese Yen and Korean Won don't use decimals
    const decimals = (currency === 'JPY' || currency === 'KRW') ? 0 : 2;
    
    return `${currencyInfo.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();

    const payload = {
      program_name: formData.program_name,
      points_balance: parseFloat(formData.points_balance) || 0,
      program_type: formData.program_type || null,
      conversion_rate: parseFloat(formData.conversion_rate) || null
    };

    const result = await createReward(payload);
    if (result) {
      setShowCreateForm(false);
      setFormData({ program_name: '', points_balance: '', program_type: '', conversion_rate: '' });
      loadRewards();
    }
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();

    const payload = {
      program_name: formData.program_name,
      points_balance: parseFloat(formData.points_balance),
      program_type: formData.program_type || null,
      conversion_rate: parseFloat(formData.conversion_rate) || null
    };

    const result = await updateReward(editingReward.id, payload);
    if (result) {
      setEditingReward(null);
      setFormData({ program_name: '', points_balance: '', program_type: '', conversion_rate: '' });
      loadRewards();
    }
  };

  const handleDeleteReward = async () => {
    if (!rewardToDelete) return;
    
    const result = await deleteReward(rewardToDelete.id);
    if (result) {
      setShowDeleteConfirm(false);
      setRewardToDelete(null);
      loadRewards();
    }
  };

  const handleEditClick = (reward) => {
    setEditingReward(reward);
    setFormData({
      program_name: reward.program_name,
      points_balance: reward.points_balance.toString(),
      program_type: reward.program_type || '',
      conversion_rate: reward.conversion_rate?.toString() || ''
    });
    setShowCreateForm(false);
  };

  const handleAddPointsClick = (reward) => {
    setSelectedReward(reward);
    setPointsToAdd('');
    setShowAddPointsModal(true);
  };

  const handleAddPoints = async () => {
    if (!selectedReward || !pointsToAdd) return;

    const points = parseFloat(pointsToAdd);
    if (isNaN(points) || points === 0) {
      toast.error('Please enter a valid points value', {
        duration: 3000,
      });
      return;
    }

    const result = await addPointsAPI(selectedReward.id, points);
    if (result) {
      setShowAddPointsModal(false);
      setSelectedReward(null);
      setPointsToAdd('');
      loadRewards();
    }
  };

  const handleRefreshRates = async () => {
    await refreshExchangeRates();
    await loadRewards();
  };

  const getProgramTypeIcon = (type) => {
    const icons = {
      airline: '✈️',
      hotel: '🏨',
      cashback: '💰',
      retail: '🛍️',
      credit_card: '💳',
      travel: '🌍'
    };
    return icons[type?.toLowerCase()] || '🎁';
  };

  const getProgramTypeBadge = (type) => {
    if (!type) return null;
    
    const colors = {
      airline: 'bg-blue-100 text-blue-800 border-blue-200',
      hotel: 'bg-purple-100 text-purple-800 border-purple-200',
      cashback: 'bg-green-100 text-green-800 border-green-200',
      retail: 'bg-pink-100 text-pink-800 border-pink-200',
      credit_card: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      travel: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    const colorClass = colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
        {type}
      </span>
    );
  };

  if (loading && !summary) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">💎 Rewards Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your reward programs and points across different currencies
          </p>
        </div>
        <div className="flex gap-3">
          {/* Currency Selector Dropdown */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium bg-white"
          >
            {Object.entries(currencies).map(([code, info]) => (
              <option key={code} value={code}>
                {info.flag} {code} ({info.symbol})
              </option>
            ))}
          </select>

          <button
            onClick={handleRefreshRates}
            disabled={ratesLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {ratesLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                💱 Refresh Rates
              </>
            )}
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingReward(null);
              setFormData({ program_name: '', points_balance: '', program_type: '', conversion_rate: '' });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Program
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Total Programs</h3>
            <p className="text-3xl font-bold text-blue-900">{summary.total_programs}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-1">Total Points</h3>
            <p className="text-3xl font-bold text-purple-900">{summary.total_points.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Total Value ({selectedCurrency})
            </h3>
            <p className="text-3xl font-bold text-green-900">
              {formatValue(getTotalValue(selectedCurrency), selectedCurrency)}
            </p>
          </div>
        </div>
      )}

      {/* Exchange Rate Info */}
      {summary && summary.exchange_rates && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-indigo-900 mb-2">💱 Exchange Rates (1 USD =)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                {Object.entries(currencies).filter(([code]) => code !== 'USD').map(([code, info]) => (
                  <p key={code} className="text-sm text-indigo-800">
                    {info.flag} <strong>{info.symbol}{summary.exchange_rates[code]?.toFixed(code === 'JPY' || code === 'KRW' ? 0 : 2)}</strong> {code}
                  </p>
                ))}
              </div>
            </div>
            {summary.cache_info?.last_updated && (
              <div className="text-right">
                <p className="text-xs text-gray-600">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(summary.cache_info.last_updated).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Rewards Message */}
      {summary && summary.total_programs === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">🎁</div>
          <p className="text-gray-600 mb-4">No reward programs found. Add your first one!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Reward Program
          </button>
        </div>
      )}

      {/* Rewards List */}
      {summary && summary.rewards && summary.rewards.length > 0 && (
        <div className="space-y-4">
          {summary.rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getProgramTypeIcon(reward.program_type)}</span>
                    <h3 className="text-xl font-bold text-gray-800">{reward.program_name}</h3>
                    {getProgramTypeBadge(reward.program_type)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {/* Points Balance */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Points Balance</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {reward.points_balance.toLocaleString()}
                      </p>
                    </div>

                    {/* Value in Selected Currency */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        Value ({selectedCurrency})
                      </p>
                      <p className="text-xl font-semibold text-green-600">
                        {formatValue(getValueInCurrency(reward, selectedCurrency), selectedCurrency)}
                      </p>
                    </div>

                    {/* Conversion Rate */}
                    {reward.conversion_rate && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Conversion Rate</p>
                        <p className="text-sm font-medium text-gray-700">
                          {reward.conversion_rate} pts = $1
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Last Updated */}
                  <p className="text-xs text-gray-500 mt-3">
                    <strong>Last Updated:</strong> {new Date(reward.last_updated).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleAddPointsClick(reward)}
                  className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                  +/- Points
                </button>
                <button
                  onClick={() => handleEditClick(reward)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setRewardToDelete(reward);
                    setShowDeleteConfirm(true);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal - same as before */}
      <Modal
        isOpen={showCreateForm || !!editingReward}
        onClose={() => {
          setShowCreateForm(false);
          setEditingReward(null);
          setFormData({ program_name: '', points_balance: '', program_type: '', conversion_rate: '' });
        }}
        title={editingReward ? 'Edit Reward Program' : 'Add New Reward Program'}
      >
        <form onSubmit={editingReward ? handleUpdateReward : handleCreateReward} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.program_name}
              onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
              required
              placeholder="e.g., Airline Miles, Hotel Points"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points Balance: <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.points_balance}
              onChange={(e) => setFormData({ ...formData, points_balance: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="e.g., 50000"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Type:
            </label>
            <select
              value={formData.program_type}
              onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select type (optional)</option>
              <option value="airline">✈️ Airline</option>
              <option value="hotel">🏨 Hotel</option>
              <option value="cashback">💰 Cashback</option>
              <option value="retail">🛍️ Retail</option>
              <option value="credit_card">💳 Credit Card</option>
              <option value="travel">🌍 Travel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conversion Rate (points per $1):
            </label>
            <input
              type="number"
              value={formData.conversion_rate}
              onChange={(e) => setFormData({ ...formData, conversion_rate: e.target.value })}
              min="0.01"
              step="0.01"
              placeholder="e.g., 100 (means 100 points = $1)"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              How many points equal $1 USD? (e.g., if 100 points = $1, enter 100)
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-medium transition-colors"
            >
              {editingReward ? 'Update Program' : 'Add Program'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setEditingReward(null);
                setFormData({ program_name: '', points_balance: '', program_type: '', conversion_rate: '' });
              }}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Add Points Modal - same as before */}
      <Modal
        isOpen={showAddPointsModal}
        onClose={() => {
          setShowAddPointsModal(false);
          setSelectedReward(null);
          setPointsToAdd('');
        }}
        title="Add or Deduct Points"
      >
        {selectedReward && (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded p-4">
              <p className="text-purple-800 font-medium mb-2">
                {selectedReward.program_name}
              </p>
              <p className="text-sm text-purple-700">
                Current Balance: <strong>{selectedReward.points_balance.toLocaleString()}</strong> points
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points to Add/Deduct:
              </label>
              <input
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="Enter positive to add, negative to deduct"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use positive numbers to add points, negative to deduct (e.g., -500 to deduct 500 points)
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPoints}
                disabled={!pointsToAdd || pointsToAdd === '0'}
                className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Points
              </button>
              <button
                onClick={() => {
                  setShowAddPointsModal(false);
                  setSelectedReward(null);
                  setPointsToAdd('');
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal - updated to show selected currency */}
      
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setRewardToDelete(null);
        }}
        title="Delete Reward Program"
      >
        {rewardToDelete && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Are you sure you want to delete this reward program?
              </p>
              <p className="text-sm text-red-700">
                Program: <strong>{rewardToDelete.program_name}</strong>
              </p>
              <p className="text-sm text-red-700">
                Points: <strong>{rewardToDelete.points_balance.toLocaleString()}</strong>
              </p>
              <p className="text-sm text-red-700">
                Value: <strong>{formatValue(getValueInCurrency(rewardToDelete, selectedCurrency), selectedCurrency)}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-600">
              This action cannot be undone. The reward program and all its points will be permanently deleted.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeleteReward}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Delete Program
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRewardToDelete(null);
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add other modals here - Create/Edit and Add Points modals remain the same as original */}
    </div>
  );
};

export default RewardManagement;