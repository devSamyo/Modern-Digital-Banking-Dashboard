import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.ME);
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile', { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const satisfiedCount = Object.values(requirements).filter(Boolean).length;
    
    let strength = 'Weak';
    let color = 'red';
    let widthPercent = 20;

    if (satisfiedCount === 5) {
      strength = 'Strong';
      color = 'green';
      widthPercent = 100;
    } else if (satisfiedCount >= 3) {
      strength = 'Medium';
      color = 'yellow';
      widthPercent = 60;
    }

    return { requirements, strength, color, widthPercent };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    // Check password strength
    const { requirements } = checkPasswordStrength(passwordForm.new_password);
    const allRequirementsMet = Object.values(requirements).every(Boolean);
    
    if (!allRequirementsMet) {
      toast.error('Please meet all password requirements');
      return;
    }

    try {
      setSubmitting(true);
      await api.put(API_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      toast.success('Password changed successfully!');
      setShowChangePasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to change password';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPasswordChange = () => {
    setShowChangePasswordModal(false);
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  const getKycStatusColor = (status) => {
    const colors = {
      'verified': 'bg-green-100 text-green-800 border-green-300',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'unverified': 'bg-red-100 text-red-800 border-red-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getKycStatusIcon = (status) => {
    const icons = {
      'verified': '✓',
      'pending': '⏳',
      'unverified': '✗',
      'rejected': '✗',
    };
    return icons[status] || '?';
  };

  const getKycStatusText = (status) => {
    const texts = {
      'verified': 'Verified',
      'pending': 'Pending Verification',
      'unverified': 'Not Verified',
      'rejected': 'Rejected',
    };
    return texts[status] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load profile information</p>
      </div>
    );
  }

  const passwordStrength = passwordForm.new_password 
    ? checkPasswordStrength(passwordForm.new_password) 
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">👤 My Profile</h2>
        <p className="text-gray-600">Your personal information and account details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section with Avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white border-opacity-30">
              {userInfo.name?.charAt(0).toUpperCase() || '?'}
            </div>
            
            <div>
              <h3 className="text-3xl font-bold mb-1">{userInfo.name || 'User'}</h3>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Full Name
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-800 font-medium text-lg">
                  {userInfo.name || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Email Address
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-800 font-medium text-lg">
                  {userInfo.email || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Phone Number
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-800 font-medium text-lg">
                  {userInfo.phone || 'Not provided'}
                </p>
              </div>
            </div>

            {/* KYC Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                KYC Status
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-semibold ${getKycStatusColor(userInfo.kyc_status)}`}>
                  <span className="text-lg">{getKycStatusIcon(userInfo.kyc_status)}</span>
                  {getKycStatusText(userInfo.kyc_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Button */}
          <div className="mt-8">
            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <span>🔒</span>
              Change Password
            </button>
          </div>

          {/* Account Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium mb-1">User ID</p>
              <p className="text-2xl font-bold text-blue-900">{userInfo.id}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium mb-1">Account Status</p>
              <p className="text-2xl font-bold text-green-900">Active</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-600 font-medium mb-1">KYC Status</p>
              <p className="text-2xl font-bold text-purple-900 capitalize">
                {getKycStatusText(userInfo.kyc_status).split(' ')[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL: Change Password ═══ */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={cancelPasswordChange}
        title="Change Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter current password"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter new password"
            />
            
            {/* Password Strength Indicator */}
            {passwordStrength && passwordForm.new_password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                  <span className={`text-xs font-bold text-${passwordStrength.color}-600`}>
                    {passwordStrength.strength}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${passwordStrength.color}-500 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${passwordStrength.widthPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {passwordStrength && passwordForm.new_password && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-gray-600 mb-1">Requirements:</p>
                <div className="text-xs space-y-1">
                  <div className={`flex items-center gap-2 ${passwordStrength.requirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{passwordStrength.requirements.length ? '✓' : '○'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{passwordStrength.requirements.uppercase ? '✓' : '○'}</span>
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{passwordStrength.requirements.lowercase ? '✓' : '○'}</span>
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.requirements.digit ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{passwordStrength.requirements.digit ? '✓' : '○'}</span>
                    <span>One digit</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordStrength.requirements.special ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{passwordStrength.requirements.special ? '✓' : '○'}</span>
                    <span>One special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Confirm new password"
            />
            {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={submitting || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {submitting ? 'Changing Password...' : 'Change Password'}
            </button>
            <button
              type="button"
              onClick={cancelPasswordChange}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;