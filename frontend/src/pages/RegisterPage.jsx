import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ShieldCheck, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';

function RegisterPage() {
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState(''); // 🔥 Success status ke liye
  const [step, setStep] = useState(1); 
  const [resendTimer, setResendTimer] = useState(0); // 🔥 Timer state (0 means button active)
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    getValues, 
    formState: { errors, isSubmitting } 
  } = useForm({
    mode: "onTouched"
  });

  // 🔥 TIMER EFFECT: Jab step 2 active ho aur timer > 0 ho, toh har second ghtao
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 🔥 ACTION FOR STEP 1: Trigger OTP Request
  const handleRequestOtp = async (data) => {
    setServerError('');
    setServerSuccess('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username, email: data.email }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to send verification code');

      setServerSuccess('📩 Verification OTP sent to your email!');
      setStep(2); 
      setResendTimer(30); // 🔥 30 seconds ka cooldown lagao
    } catch (err) {
      setServerError(err.message);
    }
  };

  // 🔥 NEW ACTION: Resend OTP Handler
  const handleResendOtp = async () => {
    setServerError('');
    setServerSuccess('');
    
    // Form se current fields ki value uthao bina submit trigger kiye
    const username = getValues('username');
    const email = getValues('email');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to resend verification code');

      setServerSuccess('🔄 A new OTP has been dispatched to your inbox!');
      setResendTimer(30); // Reset timer back to 30s
    } catch (err) {
      setServerError(err.message);
    }
  };

  // 🔥 ACTION FOR STEP 2: Final Accounts Extraction
  const handleVerifyAndRegister = async (data) => {
    setServerError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: data.username, 
          email: data.email, 
          password: data.password,
          otp: data.otp 
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Verification failed');

      localStorage.setItem('token', resData.token);
      localStorage.setItem('user', JSON.stringify(resData.user));
      navigate('/');
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full text-white mb-3 shadow-lg">
            {step === 1 ? <UserPlus size={32} /> : <ShieldCheck size={32} />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Create Account' : 'Verify Your Email'}
          </h1>
          <p className="text-slate-400 text-xs text-center mt-1 px-4">
            {step === 1 
              ? "Join us today! Enter your details to receive an activation token." 
              : `Enter the 6-digit verification code sent to ${getValues('email')}`
            }
          </p>
        </div>

        {/* 🚨 Error Alert */}
        {serverError && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl text-sm mb-4">
            {serverError}
          </div>
        )}

        {/* ✅ Success Alert */}
        {serverSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-3 rounded-xl text-sm mb-4">
            {serverSuccess}
          </div>
        )}

        <form onSubmit={step === 1 ? handleSubmit(handleRequestOtp) : handleSubmit(handleVerifyAndRegister)} className="space-y-4">
          
          {step === 1 && (
            <>
              {/* USERNAME */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><User size={16}/> Username</label>
                <input 
                  type="text" 
                  placeholder="john_doe" 
                  className={`w-full px-4 py-2.5 bg-slate-700 border rounded-xl text-white focus:outline-none transition ${errors.username ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                  {...register("username", { required: "Username is required", minLength: { value: 3, message: "Min 3 characters" }})} 
                />
                {errors.username && <p className="text-red-400 text-xs mt-1 pl-1">{errors.username.message}</p>}
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><Mail size={16}/> Email</label>
                <input 
                  type="text" 
                  placeholder="john@example.com" 
                  className={`w-full px-4 py-2.5 bg-slate-700 border rounded-xl text-white focus:outline-none transition ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                  {...register("email", { 
                    required: "Email is required",
                    pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: "Please enter a valid email address" }
                  })} 
                />
                {errors.email && <p className="text-red-400 text-xs mt-1 pl-1">{errors.email.message}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><Lock size={16}/> Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full px-4 py-2.5 bg-slate-700 border rounded-xl text-white focus:outline-none transition ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" }})} 
                />
                {errors.password && <p className="text-red-400 text-xs mt-1 pl-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg disabled:opacity-50">
                {isSubmitting ? 'Sending OTP... ⏳' : 'Send Verification Code'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* OTP CODE FIELD */}
              <div>
                <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><ShieldCheck size={16}/> Enter 6-Digit Signup Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000" 
                  className={`w-full px-4 py-2.5 bg-slate-700 border rounded-xl text-white font-mono tracking-widest text-center text-lg focus:outline-none transition ${errors.otp ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                  {...register("otp", { required: "Verification OTP is required", maxLength: 6, minLength: 6 })} 
                />
                {errors.otp && <p className="text-red-400 text-xs mt-1 pl-1">Enter a valid 6-digit OTP code.</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg disabled:opacity-50">
                {isSubmitting ? 'Verifying Credentials... ⏳' : 'Complete Registration'}
              </button>

              {/* 🔥 NEW RESEND OTP CONTAINER SECTION */}
              <div className="flex flex-col items-center justify-center pt-2 space-y-2 border-t border-slate-700/50 mt-4">
                {resendTimer > 0 ? (
                  <p className="text-xs text-slate-400">
                    Resend code available in <span className="text-blue-400 font-semibold font-mono">{resendTimer}s</span>
                  </p>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 transition active:scale-95"
                  >
                    <RotateCcw size={12} /> Resend Verification Code
                  </button>
                )}

                <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:underline">
                  Edit Registration Info
                </button>
              </div>
            </>
          )}

        </form>

        <p className="text-slate-400 text-sm text-center mt-4">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;