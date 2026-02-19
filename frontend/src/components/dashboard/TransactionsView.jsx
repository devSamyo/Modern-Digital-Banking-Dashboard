import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import TransactionForm from './TransactionForm';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';
import { API_ENDPOINTS, API_BASE_URL } from '../../config';

const TransactionsView = ({ accountId, onBack, onBalanceChange }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [accountId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.TRANSACTIONS_BY_ACCOUNT(accountId));
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CATEGORIES);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([
        { name: 'Food & Dining' },
        { name: 'Transportation' },
        { name: 'Shopping' },
        { name: 'Entertainment' },
        { name: 'Bills & Utilities' },
        { name: 'Healthcare' },
        { name: 'Education' },
        { name: 'Others' }
      ]);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadTransactions();
    
    if (onBalanceChange) {
      onBalanceChange();
    }
  };

  const handleCategoryChange = async (transactionId, newCategory) => {
    try {
      await api.patch(API_ENDPOINTS.UPDATE_TRANSACTION_CATEGORY(transactionId), {
        category: newCategory
      });
      
      toast.success('Category updated successfully!');
      setEditingCategoryId(null);
      loadTransactions();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error.response?.data?.detail || 'Failed to update category');
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('access_token');

      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.EXPORT_TRANSACTIONS_CSV(accountId)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/csv'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error:', errorText);
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${accountId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Transactions exported successfully!');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error(error.message || 'Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.IMPORT_TRANSACTIONS_CSV(accountId)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );
      
      const result = await response.json();
      
      // DEBUG: Log the full response
      console.log('Import response:', result);
      console.log('Headers found:', result.headers_found);
      
      if (!response.ok) {
        throw new Error(result.detail || 'Import failed');
      }
      
      toast.success(
        `Import completed! ${result.imported} imported, ${result.skipped} skipped`,
        { duration: 4000 }
      );
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
        toast.error(`${result.errors.length} rows had errors. Check console for details.`, {
          duration: 5000
        });
      }
      
      loadTransactions();
      if (onBalanceChange) {
        onBalanceChange();
      }
      
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast.error(error.message || 'Failed to import transactions');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': 'bg-orange-100 text-orange-800 border-orange-200',
      'Transportation': 'bg-blue-100 text-blue-800 border-blue-200',
      'Shopping': 'bg-purple-100 text-purple-800 border-purple-200',
      'Entertainment': 'bg-pink-100 text-pink-800 border-pink-200',
      'Bills & Utilities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Healthcare': 'bg-red-100 text-red-800 border-red-200',
      'Education': 'bg-green-100 text-green-800 border-green-200',
      'Salary': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Investment': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Others': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          ← Back
        </button>
        
        <div className="flex gap-2">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting || transactions.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Exporting...
              </>
            ) : (
              <>
                📥 Export CSV
              </>
            )}
          </button>
          
          {/* Import CSV Button */}
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Importing...
              </>
            ) : (
              <>
                📤 Import CSV
              </>
            )}
          </button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Add Transaction Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm transition-colors"
          >
            + Add Transaction
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        Transactions
      </h2>

      {/* CSV Import Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800 font-semibold mb-2">📋 CSV Import Format</p>
        <p className="text-xs text-blue-700">
          Required columns: <code className="bg-blue-100 px-1 rounded">Date, Description, Amount, Type</code><br/>
          Optional columns: <code className="bg-blue-100 px-1 rounded">Merchant, Currency</code><br/>
          Date format: <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD HH:MM:SS</code> or <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD</code><br/>
          Type must be: <code className="bg-blue-100 px-1 rounded">debit</code> or <code className="bg-blue-100 px-1 rounded">credit</code>
        </p>
      </div>

      {/* No transactions message */}
      {transactions.length === 0 && !showCreateForm && (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-gray-600">No transactions found.</p>
        </div>
      )}

      {/* Transactions list */}
      <div className="space-y-3 mb-6">
        {transactions.map((txn) => (
          <div key={txn.id} className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="font-bold text-lg">{txn.merchant || 'N/A'}</p>
                <p className="text-gray-600 text-sm mt-1">{txn.description}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${txn.txn_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.txn_type === 'credit' ? '+' : '-'}₹{txn.amount}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(txn.txn_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Category Section */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">Category:</span>
              
              {editingCategoryId === txn.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={txn.category}
                    onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingCategoryId(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(txn.category)}`}>
                    {txn.category}
                  </span>
                  <button
                    onClick={() => setEditingCategoryId(txn.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="mt-2 text-xs text-gray-500">
              <span className="capitalize">{txn.txn_type}</span> • {new Date(txn.txn_date).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Create transaction form in modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Add New Transaction"
      >
        <TransactionForm
          accountId={accountId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      </Modal>
    </section>
  );
};

export default TransactionsView;