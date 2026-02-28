
import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isReset) {
        await authService.resetPassword(email);
        setMessage({ text: "Password reset link sent! Check your email. 📧", type: 'success' });
        return;
      }

      let user;
      if (isSignup) {
        user = await authService.signup(email, password, fullName);
        setMessage({ text: "Account created! You received 5 FREE credits! 🎁", type: 'success' });
      } else {
        user = await authService.login(email, password);
        setMessage({ text: "Welcome back!", type: 'success' });
      }
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 1500);
    } catch (err: any) {
      let errorMsg = err.message || "Authentication failed";
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = "Incorrect email or password. Please try again or sign up if you don't have an account.";
      } else if (errorMsg.includes('email rate limit exceeded')) {
        errorMsg = "Too many requests. Please wait a few minutes before trying to reset your password again.";
      }
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 serif italic tracking-tight">
            {isReset ? 'Reset Password' : (isSignup ? 'Create Account' : 'Welcome Back')}
          </h2>
          <p className="text-slate-500 font-medium text-xs">
            {isReset ? 'Enter your email to receive a reset link.' : (isSignup ? 'Join and get 5 free credits instantly! 🎁' : 'Login to access your high-res art gallery.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && !isReset && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" required placeholder="John Doe"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold text-sm"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input 
              type="email" required placeholder="name@example.com"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold text-sm"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {!isReset && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {!isSignup && (
                  <button 
                    type="button" onClick={() => setIsReset(true)}
                    className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" required placeholder="••••••••"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold text-sm"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {message && (
            <p className={`text-[10px] font-black uppercase tracking-widest text-center animate-pulse ${message.type === 'success' ? 'text-green-500' : 'text-rose-500'}`}>
              {message.text}
            </p>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] border-b-4 border-black"
          >
            {loading ? 'Authenticating...' : (isReset ? 'Send Reset Link' : (isSignup ? 'Create Free Account' : 'Sign In'))}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          {isReset ? (
            <button 
              onClick={() => setIsReset(false)}
              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
            >
              Back to Login
            </button>
          ) : (
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up (+5 Credits)"}
            </button>
          )}
          <div className="h-px w-8 bg-slate-100 mx-auto"></div>
          <button onClick={onClose} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
