import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import { useBillReminder } from '../../hooks/useBillReminder';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const BillManagement = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [formData, setFormData] = useState({
    biller_name: '',
    due_date: '',
    amount_due: '',
    auto_pay: false
  });

  // Bill reminder hook
  const { sendReminders, loading: reminderLoading } = useBillReminder();

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.BILLS);
      setBills(response.data);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();

    const payload = {
      biller_name: formData.biller_name,
      due_date: formData.due_date,
      amount_due: parseFloat(formData.amount_due),
      auto_pay: formData.auto_pay
    };

    try {
      await api.post(API_ENDPOINTS.BILLS, payload);
      toast.success('Bill created successfully!');
      setShowCreateForm(false);
      setFormData({ biller_name: '', due_date: '', amount_due: '', auto_pay: false });
      loadBills();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error(error.response?.data?.detail || 'Failed to create bill');
    }
  };

  const handleUpdateBill = async (e) => {
    e.preventDefault();

    const payload = {
      biller_name: formData.biller_name,
      due_date: formData.due_date,
      amount_due: parseFloat(formData.amount_due),
      auto_pay: formData.auto_pay
    };

    try {
      await api.put(API_ENDPOINTS.BILL_BY_ID(editingBill.id), payload);
      toast.success('Bill updated successfully!');
      setEditingBill(null);
      setFormData({ biller_name: '', due_date: '', amount_due: '', auto_pay: false });
      loadBills();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error(error.response?.data?.detail || 'Failed to update bill');
    }
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;
    
    try {
      await api.delete(API_ENDPOINTS.BILL_BY_ID(billToDelete.id));
      toast.success('Bill deleted successfully!');
      setShowDeleteConfirm(false);
      setBillToDelete(null);
      loadBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      await api.post(API_ENDPOINTS.MARK_BILL_PAID(billId));
      toast.success('Bill marked as paid!');
      loadBills();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast.error('Failed to mark bill as paid');
    }
  };

  const handleSendReminders = async () => {
    const result = await sendReminders(3);
    if (result) {
      loadBills(); // Reload bills to show updated reminder status
    }
  };

  const handleEditClick = (bill) => {
    setEditingBill(bill);
    setFormData({
      biller_name: bill.biller_name,
      due_date: bill.due_date,
      amount_due: bill.amount_due.toString(),
      auto_pay: bill.auto_pay
    });
    setShowCreateForm(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || styles.upcoming;
  };

  const getStatusIcon = (status) => {
    const icons = {
      upcoming: '📅',
      paid: '✅',
      overdue: '⚠️'
    };
    return icons[status] || '📄';
  };

  const getDaysMessage = (daysUntilDue) => {
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} days overdue`;
    } else if (daysUntilDue === 0) {
      return 'Due today!';
    } else if (daysUntilDue === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${daysUntilDue} days`;
    }
  };

  const formatReminderDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const upcomingBills = bills.filter(b => b.status === 'upcoming');
  const overdueBills = bills.filter(b => b.status === 'overdue');
  const paidBills = bills.filter(b => b.status === 'paid');

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bills Management</h2>
        <div className="flex gap-3">
          <button
            onClick={handleSendReminders}
            disabled={reminderLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {reminderLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                📧 Send Reminders Now
              </>
            )}
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingBill(null);
              setFormData({ biller_name: '', due_date: '', amount_due: '', auto_pay: false });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Bill
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Upcoming Bills</h3>
          <p className="text-2xl font-bold text-blue-900">{upcomingBills.length}</p>
          <p className="text-sm text-blue-600 mt-1">
            ₹{upcomingBills.reduce((sum, b) => sum + b.amount_due, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-1">Overdue Bills</h3>
          <p className="text-2xl font-bold text-red-900">{overdueBills.length}</p>
          <p className="text-sm text-red-600 mt-1">
            ₹{overdueBills.reduce((sum, b) => sum + b.amount_due, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-1">Paid Bills</h3>
          <p className="text-2xl font-bold text-green-900">{paidBills.length}</p>
          <p className="text-sm text-green-600 mt-1">
            ₹{paidBills.reduce((sum, b) => sum + b.amount_due, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* No Bills Message */}
      {bills.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">No bills found. Add your first bill!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Bill
          </button>
        </div>
      )}

      {/* Bills List */}
      <div className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              bill.status === 'overdue' ? 'border-red-500' :
              bill.status === 'paid' ? 'border-green-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-800">{bill.biller_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(bill.status)}`}>
                    {getStatusIcon(bill.status)} {bill.status.toUpperCase()}
                  </span>
                  {bill.auto_pay && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      🔄 Auto-Pay
                    </span>
                  )}
                  {/* Reminder Badge */}
                  {bill.reminder_sent && bill.status !== 'paid' && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium border border-yellow-300">
                      📧 Reminded {bill.reminder_count}x
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Due Date:</strong> {new Date(bill.due_date).toLocaleDateString()} 
                    {bill.status !== 'paid' && (
                      <span className={`ml-2 font-medium ${bill.days_until_due < 0 ? 'text-red-600' : bill.days_until_due <= 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        ({getDaysMessage(bill.days_until_due)})
                      </span>
                    )}
                  </p>
                  <p><strong>Amount:</strong> ₹{bill.amount_due.toFixed(2)}</p>
                  {/* Reminder Info */}
                  {bill.reminder_sent && (
                    <p className="text-xs text-gray-500">
                      <strong>Last Reminder:</strong> {formatReminderDate(bill.reminder_sent_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              {bill.status !== 'paid' && (
                <button
                  onClick={() => handleMarkAsPaid(bill.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-medium"
                >
                  Mark as Paid
                </button>
              )}
              <button
                onClick={() => handleEditClick(bill)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setBillToDelete(bill);
                  setShowDeleteConfirm(true);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Bill Modal */}
      <Modal
        isOpen={showCreateForm || !!editingBill}
        onClose={() => {
          setShowCreateForm(false);
          setEditingBill(null);
          setFormData({ biller_name: '', due_date: '', amount_due: '', auto_pay: false });
        }}
        title={editingBill ? 'Edit Bill' : 'Add New Bill'}
      >
        <form onSubmit={editingBill ? handleUpdateBill : handleCreateBill} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Biller Name:
            </label>
            <input
              type="text"
              value={formData.biller_name}
              onChange={(e) => setFormData({ ...formData, biller_name: e.target.value })}
              required
              placeholder="e.g., Electric Company"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date:
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Due (₹):
            </label>
            <input
              type="number"
              value={formData.amount_due}
              onChange={(e) => setFormData({ ...formData, amount_due: e.target.value })}
              required
              min="0.01"
              step="0.01"
              placeholder="e.g., 1500"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_pay"
              checked={formData.auto_pay}
              onChange={(e) => setFormData({ ...formData, auto_pay: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_pay" className="ml-2 block text-sm text-gray-700">
              Enable Auto-Pay
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition-colors"
            >
              {editingBill ? 'Update Bill' : 'Add Bill'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setEditingBill(null);
                setFormData({ biller_name: '', due_date: '', amount_due: '', auto_pay: false });
              }}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBillToDelete(null);
        }}
        title="Delete Bill"
      >
        {billToDelete && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium mb-2">
                ⚠️ Are you sure you want to delete this bill?
              </p>
              <p className="text-sm text-red-700">
                Biller: <strong>{billToDelete.biller_name}</strong>
              </p>
              <p className="text-sm text-red-700">
                Amount: <strong>₹{billToDelete.amount_due.toFixed(2)}</strong>
              </p>
              <p className="text-sm text-red-700">
                Due Date: <strong>{new Date(billToDelete.due_date).toLocaleDateString()}</strong>
              </p>
            </div>

            <p className="text-sm text-gray-600">
              This action cannot be undone. The bill will be permanently deleted.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeleteBill}
                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Delete Bill
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setBillToDelete(null);
                }}
                className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
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

export default BillManagement;