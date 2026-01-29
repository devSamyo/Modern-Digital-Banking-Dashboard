import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config';
import Header from '../common/Header';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, formData);
      const { access_token } = response.data;
      
      login(access_token);
      toast.success('Login successful! Welcome back!');
      navigate('/dashboard');
    } catch (error) {
        // console.log('Full error:', error.response);
        // console.log('Error data:', error.response?.data);
        toast.error(error.response?.data?.detail || 'Login failed!');
      }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">User Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium"
            >
              Login
            </button>
          </form>

          {/* Register link */}
          <p className="text-center mt-4 text-sm text-gray-600">
            Not registered yet?{' '}
            <Link to="/register" className="text-blue-600 underline hover:text-blue-800 font-medium">
              Register here!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;