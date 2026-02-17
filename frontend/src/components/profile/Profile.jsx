import { useState, useEffect } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import toast from 'react-hot-toast';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load profile', {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white border-opacity-30">
              {userInfo.name?.charAt(0).toUpperCase() || '?'}
            </div>
            
            {/* User Info */}
            <div>
              <h3 className="text-3xl font-bold mb-1">{userInfo.name || 'User'}</h3>
              {/* <p className="text-blue-100 text-sm">Member since {formatDate(userInfo.created_at)}</p> */}
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

          {/* KYC Alert (if not verified)
          {userInfo.kyc_status !== 'verified' && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    KYC Verification Required
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Complete your KYC verification to unlock all features and increase your transaction limits.
                  </p>
                  <button className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                    Complete KYC Verification
                  </button>
                </div>
              </div>
            </div>
          )} */}

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

      {/* Additional Info Card */}
      {/* <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Account Created</span>
            <span className="font-medium text-gray-800">{formatDate(userInfo.created_at)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Email Verified</span>
            <span className="font-medium text-green-600">✓ Verified</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Phone Verified</span>
            <span className="font-medium text-gray-400">
              {userInfo.phone ? '✓ Verified' : '✗ Not Added'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Two-Factor Authentication</span>
            <span className="font-medium text-gray-400">✗ Not Enabled</span>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Profile;