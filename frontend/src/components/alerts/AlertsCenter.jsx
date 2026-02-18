import { useState, useEffect } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import Modal from '../common/Modal';

const AlertsCenter = ({ onAlertsChange }) => {
  const { alerts, loading, fetchAlerts, markAsRead, markAllAsRead, deleteAlert } = useAlerts();
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAlerts(filter === 'unread');

    // Auto-refresh alerts every 5 seconds while on this tab
    const alertsInterval = setInterval(() => {
      fetchAlerts(filter === 'unread');
    }, 5000); // Poll every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(alertsInterval);
  }, [filter]);

  const getAlertIcon = (type) => {
    const icons = {
      'low_balance': '⚠️',
      'bill_due': '📅',
      'budget_exceeded': '💸'
    };
    return icons[type] || '🔔';
  };

  const getAlertColor = (type) => {
    const colors = {
      'low_balance': 'border-l-yellow-500 bg-yellow-50',
      'bill_due': 'border-l-orange-500 bg-orange-50',
      'budget_exceeded': 'border-l-red-500 bg-red-50'
    };
    return colors[type] || 'border-l-gray-500 bg-gray-50';
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      'low_balance': 'Low Balance',
      'bill_due': 'Bill Reminder',
      'budget_exceeded': 'Budget Alert'
    };
    return labels[type] || 'Alert';
  };

  const handleDeleteClick = (alert) => {
    setDeleteConfirm(alert);
  };

  const handleMarkAsRead = async (alertId) => {
    await markAsRead(alertId);
    if (onAlertsChange) onAlertsChange();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    if (onAlertsChange) onAlertsChange();
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await deleteAlert(deleteConfirm.id);
      setDeleteConfirm(null);
      if (onAlertsChange) onAlertsChange();
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = alerts.filter(a => !a.read_status).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">🔔 Alerts Center</h2>
            <p className="text-gray-600 mt-2">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up! No unread alerts'
              }
            </p>
          </div>

          <div className="flex gap-3">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread Only</option>
            </select>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-semibold">TOTAL ALERTS</p>
            <p className="text-3xl font-bold text-blue-900">{alerts.length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-semibold">UNREAD</p>
            <p className="text-3xl font-bold text-orange-900">{unreadCount}</p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-semibold">READ</p>
            <p className="text-3xl font-bold text-green-900">{alerts.length - unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-600 text-lg font-semibold">No alerts to display</p>
          <p className="text-gray-500 text-sm mt-2">
            {filter === 'unread' 
              ? "You don't have any unread alerts. Great job staying on top of things!"
              : "You're all caught up! Alerts will appear here when you have low balance, upcoming bills, or budget concerns."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-5 rounded-lg shadow-md transition-all hover:shadow-lg ${getAlertColor(alert.alert_type)} ${
                alert.read_status ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0">
                  {getAlertIcon(alert.alert_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">
                      {getAlertTypeLabel(alert.alert_type)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      alert.read_status 
                        ? 'bg-gray-200 text-gray-600' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alert.read_status ? 'Read' : 'New'}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 text-base mb-2">{alert.message}</p>
                  
                  <p className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!alert.read_status && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      ✓ Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(alert)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium whitespace-nowrap px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Alert"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium mb-2">
                Are you sure you want to delete this alert?
              </p>
              <p className="text-sm text-red-700">{deleteConfirm.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AlertsCenter;