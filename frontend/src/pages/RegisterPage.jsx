import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      // Save credentials locally and move to Join page
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full text-white mb-3 shadow-lg">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl text-sm mb-4">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><User size={16}/> Username</label>
            <input type="text" required placeholder="john_doe" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><Mail size={16}/> Email</label>
            <input type="email" required placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 flex items-center gap-2"><Lock size={16}/> Password</label>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition" />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-200 shadow-lg">Sign Up</button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-4">Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Log In</Link></p>
      </div>
    </div>
  );
}

export default RegisterPage;