import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import Header from '../common/Header';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    kyc_status: 'unverified',
  });
  const [emailValid, setEmailValid] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: '',
    color: '',
    requirements: {
      length: false,
      uppercase: false,
      number: false,
      symbol: false,
    },
  });
  const [showRequirements, setShowRequirements] = useState(false);

  // Email validation
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[@$_]/.test(password),
    };

    let score = 0;
    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.number) score++;
    if (requirements.symbol) score++;

    let text = '';
    let color = '';
    let barWidth = '0%';

    switch (score) {
      case 1:
        text = 'Weak';
        color = 'text-red-600';
        barWidth = '25%';
        break;
      case 2:
        text = 'Average';
        color = 'text-orange-600';
        barWidth = '50%';
        break;
      case 3:
        text = 'Good';
        color = 'text-yellow-600';
        barWidth = '75%';
        break;
      case 4:
        text = 'Strong';
        color = 'text-green-600';
        barWidth = '100%';
        break;
      default:
        text = '';
        color = '';
    }

    return { score, text, color, barWidth, requirements };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Email validation
    if (name === 'email') {
      if (value.length > 0) {
        setEmailValid(validateEmail(value));
      } else {
        setEmailValid(null);
      }
    }

    // Password strength
    if (name === 'password') {
      if (value.length > 0) {
        setShowRequirements(true);
        setPasswordStrength(calculatePasswordStrength(value));
      } else {
        setShowRequirements(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('User already registered with this email or phone number!');
      } else {
        toast.error(error.response?.data?.detail || 'Registration failed!');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">User Registration</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email with validation */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emailValid !== null && (
                <div className={`mt-1 text-sm flex items-center gap-2 ${emailValid ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="font-bold">{emailValid ? '✓' : '✗'}</span>
                  <span>{emailValid ? 'Valid email address' : 'Invalid email format'}</span>
                </div>
              )}
            </div>

            {/* Password with strength indicator */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {showRequirements && (
                <>
                  {/* Strength bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.score === 1 ? 'bg-red-600' :
                          passwordStrength.score === 2 ? 'bg-orange-600' :
                          passwordStrength.score === 3 ? 'bg-yellow-600' :
                          passwordStrength.score === 4 ? 'bg-green-600' : ''
                        }`}
                        style={{ width: passwordStrength.barWidth }}
                      />
                    </div>
                    <p className={`text-sm font-medium mt-1 ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </p>
                  </div>

                  {/* Requirements checklist */}
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className={`flex items-center gap-2 ${passwordStrength.requirements.length ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-bold">{passwordStrength.requirements.length ? '✓' : '✗'}</span>
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-bold">{passwordStrength.requirements.uppercase ? '✓' : '✗'}</span>
                      <span>One uppercase letter</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordStrength.requirements.number ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-bold">{passwordStrength.requirements.number ? '✓' : '✗'}</span>
                      <span>One number</span>
                    </li>
                    <li className={`flex items-center gap-2 ${passwordStrength.requirements.symbol ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-bold">{passwordStrength.requirements.symbol ? '✓' : '✗'}</span>
                      <span>One symbol (@ $ _)</span>
                    </li>
                  </ul>
                </>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* KYC Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KYC Status
              </label>
              <select
                name="kyc_status"
                value={formData.kyc_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unverified">Unverified</option>
                <option value="verified">Verified</option>
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-green-500 transition-colors font-medium"
            >
              Register
            </button>
          </form>

          {/* Login link */}
          <p className="text-center mt-4 text-sm text-gray-600">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 underline hover:text-blue-800 font-medium">
              Log in here!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;