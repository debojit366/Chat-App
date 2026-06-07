import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import API from '../api.js'; //  Axios Instance

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await API.post('/api/auth/login', { email, password });
      const data = response.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials or server error';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full text-white mb-3 shadow-lg">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2">
              <Mail size={16}/> Email Address
            </label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" 
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2">
              <Lock size={16}/> Password
            </label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" 
            />
            
            {/* 🔥 FORGOT PASSWORD LINK ADDED HERE */}
            <div className="flex justify-end mt-1.5">
              <Link 
                to="/forgot-password" 
                className="text-xs text-blue-400 hover:underline hover:text-blue-300 transition"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg"
          >
            Log In
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-4">
          New here? <Link to="/register" className="text-blue-400 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;