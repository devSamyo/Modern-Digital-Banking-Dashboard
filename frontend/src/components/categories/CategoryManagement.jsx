import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const CategoryManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRecategorizeConfirm, setShowRecategorizeConfirm] = useState(false);
  const [formData, setFormData] = useState({
    category_name: '',
    keywords: '',
    merchant_patterns: ''
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.CATEGORY_RULES);
      setRules(response.data);
    } catch (error) {
      console.error('Error loading category rules:', error);
      toast.error('Failed to load category rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    
    const payload = {
      category_name: formData.category_name,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      merchant_patterns: formData.merchant_patterns 
        ? formData.merchant_patterns.split(',').map(m => m.trim()).filter(m => m)
        : []
    };

    try {
      await api.post(API_ENDPOINTS.CATEGORY_RULES, payload);
      toast.success('Category rule created successfully!');
      setShowCreateForm(false);
      setFormData({ category_name: '', keywords: '', merchant_patterns: '' });
      loadRules();
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to create rule');
    }
  };

  const handleUpdateRule = async (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    
    const payload = {
      category_name: rule.category_name,
      keywords: rule.keywords,
      merchant_patterns: rule.merchant_patterns || []
    };

    try {
      await api.put(`${API_ENDPOINTS.CATEGORY_RULES}/${ruleId}`, payload);
      toast.success('Category rule updated successfully!');
      setEditingRule(null);
      loadRules();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await api.delete(`${API_ENDPOINTS.CATEGORY_RULES}/${ruleId}`);
      toast.success('Category rule deleted successfully!');
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const handleEditKeywords = (ruleId, newKeywords) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, keywords: newKeywords }
        : rule
    ));
  };

  const handleEditMerchantPatterns = (ruleId, newPatterns) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, merchant_patterns: newPatterns }
        : rule
    ));
  };

  const handleAddKeyword = (ruleId) => {
    const keyword = prompt('Enter new keyword:');
    if (keyword && keyword.trim()) {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule.keywords.includes(keyword.trim())) {
        handleEditKeywords(ruleId, [...rule.keywords, keyword.trim()]);
      } else {
        toast.error('Keyword already exists');
      }
    }
  };

  const handleRemoveKeyword = (ruleId, keywordToRemove) => {
    const rule = rules.find(r => r.id === ruleId);
    handleEditKeywords(ruleId, rule.keywords.filter(k => k !== keywordToRemove));
  };

  const handleAddMerchantPattern = (ruleId) => {
    const pattern = prompt('Enter new merchant pattern:');
    if (pattern && pattern.trim()) {
      const rule = rules.find(r => r.id === ruleId);
      const currentPatterns = rule.merchant_patterns || [];
      if (!currentPatterns.includes(pattern.trim())) {
        handleEditMerchantPatterns(ruleId, [...currentPatterns, pattern.trim()]);
      } else {
        toast.error('Merchant pattern already exists');
      }
    }
  };

  const handleRemoveMerchantPattern = (ruleId, patternToRemove) => {
    const rule = rules.find(r => r.id === ruleId);
    const currentPatterns = rule.merchant_patterns || [];
    handleEditMerchantPatterns(ruleId, currentPatterns.filter(p => p !== patternToRemove));
  };

  const handleRecategorizeAll = async () => {
    setShowRecategorizeConfirm(false);
    
    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.RECATEGORIZE_ALL + '?only_others=true');
      const data = response.data;
      
      if (data.updated_count > 0) {
        toast.success(`✅ ${data.message}`, { duration: 5000 });
        
        // Show details if there were changes
        if (data.changes && data.changes.length > 0) {
          console.log('Re-categorization details:', data.changes);
        }
      } else {
        toast.info(`ℹ️ No transactions needed re-categorization. All "Others" transactions checked.`);
      }
    } catch (error) {
      console.error('Error re-categorizing:', error);
      toast.error('Failed to re-categorize transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Category Rules Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRecategorizeConfirm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
          >
            🔄 Re-Categorize All
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
          >
            + Create New Rule
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 How Category Rules Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Keywords</strong> match against transaction description</li>
          <li>• <strong>Merchant Patterns</strong> match against merchant name</li>
          <li>• You can now edit keywords and merchants for ALL rules (including system defaults)</li>
          <li>• System default rules cannot be deleted, but can be customized</li>
          <li>• Your custom rules take priority over system defaults</li>
          <li>• Click <strong>"🔄 Re-Categorize All"</strong> after updating rules to apply changes to existing transactions</li>
        </ul>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{rule.category_name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                  rule.is_system_default 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {rule.is_system_default ? 'System Default' : 'Custom Rule'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {editingRule === rule.id ? (
                  <>
                    <button
                      onClick={() => handleUpdateRule(rule.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(null);
                        loadRules();
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingRule(rule.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    {!rule.is_system_default && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the "${rule.category_name}" category rule?`)) {
                            handleDeleteRule(rule.id);
                          }
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Keywords Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Keywords:</label>
                {editingRule === rule.id && (
                  <button
                    onClick={() => handleAddKeyword(rule.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Keyword
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {rule.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    {keyword}
                    {editingRule === rule.id && (
                      <button
                        onClick={() => handleRemoveKeyword(rule.id, keyword)}
                        className="text-purple-600 hover:text-purple-900 font-bold"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {rule.keywords.length === 0 && (
                  <span className="text-gray-400 text-sm italic">No keywords</span>
                )}
              </div>
            </div>

            {/* Merchant Patterns Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Merchant Patterns:</label>
                {editingRule === rule.id && (
                  <button
                    onClick={() => handleAddMerchantPattern(rule.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Merchant Pattern
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {rule.merchant_patterns && rule.merchant_patterns.length > 0 ? (
                  rule.merchant_patterns.map((pattern, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {pattern}
                      {editingRule === rule.id && (
                        <button
                          onClick={() => handleRemoveMerchantPattern(rule.id, pattern)}
                          className="text-blue-600 hover:text-blue-900 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm italic">No merchant patterns</span>
                )}
              </div>
            </div>

            {/* Info Banner for System Defaults */}
            {rule.is_system_default && editingRule !== rule.id && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Tip:</strong> Click "Edit" to customize keywords and merchant patterns for this system default category.
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Created: {new Date(rule.created_at).toLocaleString()} • 
              Updated: {new Date(rule.updated_at).toLocaleString()}
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">No category rules found. Create your first rule!</p>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Category Rule"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name:
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              required
              placeholder="e.g., Transportation"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords (comma-separated):
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              required
              placeholder="uber, taxi, metro, bus"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate keywords with commas. These will match transaction descriptions.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant Patterns (comma-separated, optional):
            </label>
            <input
              type="text"
              value={formData.merchant_patterns}
              onChange={(e) => setFormData({ ...formData, merchant_patterns: e.target.value })}
              placeholder="Uber, Lyft, Metro"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Specific merchant names to match.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium transition-colors"
            >
              Create Rule
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Re-Categorize Confirmation Modal */}
      <Modal
        isOpen={showRecategorizeConfirm}
        onClose={() => setShowRecategorizeConfirm(false)}
        title="🔄 Smart Re-Categorization"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">What will happen:</h3>
            <ul className="text-sm text-purple-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Only transactions marked as <strong>"Others"</strong> will be checked</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Transactions with existing categories stay <strong>unchanged</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>Only updates if a matching rule is found based on your current keywords and merchant patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">ℹ</span>
                <span>This is useful after you've updated category rules with new keywords or merchants</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> This process is safe and can be run multiple times. It will only update transactions where it finds a match.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRecategorizeAll}
              className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-medium transition-colors"
            >
              Yes, Re-Categorize
            </button>
            <button
              onClick={() => setShowRecategorizeConfirm(false)}
              className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;