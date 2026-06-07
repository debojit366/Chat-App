import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import API from '../api.js';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // 🔥 CHANGE 1: Multi-step layout state configuration
  const [step, setStep] = useState(1); // step 1 = Email Input, step 2 = OTP + Password Input
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔥 CHANGE 2: Handler for Step 1 (Verify Email & Trigger OTP Generation)
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/forgot-password', { email });
      setMessage(response.data?.message || 'Verification OTP sent to your email! 📩');
      setStep(2); // Form layout switch manually to step 2 pipeline
    } catch (err) {
      setError(err.response?.data?.message || 'Database check failed or server error.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CHANGE 3: Handler for Step 2 (Verify Token & Flush New Password)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await API.post('/api/auth/reset-password', { email, otp, newPassword });
      setMessage(response.data?.message || 'Password updated successfully! 🎉');
      
      // Wait 2.5 seconds after a successful password update before redirecting to login
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or Expired OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full text-white mb-3 shadow-lg">
            {/* Dynamic Icon changes matching step layer */}
            {step === 1 ? <KeyRound size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Reset Password' : 'Verify OTP'}
          </h1>
          <p className="text-slate-400 text-xs text-center mt-1 px-4">
            {step === 1 
              ? "Enter your email address. We'll verify it in our database and send a secure OTP." 
              : `Enter the 6-digit verification code sent to ${email} and create your new password.`
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded-xl text-sm mb-4">
            {message}
          </div>
        )}

        {/* 🔥 CHANGE 4: Dynamic UI Conditional Form Splitting */}
        
        {/* LAYOUT STEP 1: ONLY EMAIL REQUEST FOR OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Searching Database... ⏳' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {/* LAYOUT STEP 2: OTP MATCH AND PASSWORD RESTRUCTURING */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2">
                <ShieldCheck size={16}/> Enter 6-Digit OTP
              </label>
              <input 
                type="text" 
                required 
                maxLength={6}
                placeholder="123456" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-blue-500 transition" 
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2">
                <Lock size={16}/> Choose New Password
              </label>
              <input 
                type="password" 
                required 
                placeholder="••••••••" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" 
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg disabled:opacity-50"
            >
              {loading ? 'Updating Password... ⏳' : 'Reset Password'}
            </button>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-blue-400 hover:underline mt-2 transition"
              >
                Change Email or Resend Code
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;