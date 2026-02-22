
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
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
      setMessage({ text: err.message || "Authentication failed", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    try {
      await authService.loginWithSocial(provider);
    } catch (err: any) {
      setMessage({ text: `Social login failed: ${err.message}. Make sure the provider is enabled in Supabase.`, type: 'error' });
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
          <h2 className="text-3xl font-black text-slate-900 serif italic tracking-tight">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-slate-500 font-medium text-xs">
            {isSignup ? 'Join and get 5 free credits instantly! 🎁' : 'Login to access your high-res art gallery.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button onClick={() => handleSocial('google')} className="flex flex-col items-center justify-center gap-1 py-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-[8px] font-black uppercase tracking-widest text-slate-600 group">
             <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
             Google
          </button>
          <button onClick={() => handleSocial('facebook')} className="flex flex-col items-center justify-center gap-1 py-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-[8px] font-black uppercase tracking-widest text-slate-600 group">
             <svg className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
             Facebook
          </button>
          <button onClick={() => handleSocial('apple')} className="flex flex-col items-center justify-center gap-1 py-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-[8px] font-black uppercase tracking-widest text-slate-600 group">
             <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.96.95-2.05 1.72-3.11 1.72-1.01 0-1.44-.61-2.66-.61s-1.74.59-2.65.59c-1.04 0-2.14-.78-3.17-1.81-2.2-2.18-2.81-5.69-1.63-7.79 1.1-1.93 3.14-3.11 5.3-3.11 1.07 0 1.95.4 2.62.4.66 0 1.63-.42 2.84-.42 1.25 0 2.37.52 3.12 1.48-2.73 1.64-2.29 5.51.52 6.78-.65 1.68-1.42 3.4-2.88 4.77M12.03 7.25c-.23-2.14 1.54-3.92 3.44-4.25.26 2.33-1.87 4.29-3.44 4.25Z"/></svg>
             Apple
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em] text-slate-300"><span className="bg-white px-3">or continue with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
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
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" required placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-rose-500 transition-all font-semibold text-sm"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && (
            <p className={`text-[10px] font-black uppercase tracking-widest text-center animate-pulse ${message.type === 'success' ? 'text-green-500' : 'text-rose-500'}`}>
              {message.text}
            </p>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] border-b-4 border-black"
          >
            {loading ? 'Authenticating...' : (isSignup ? 'Create Free Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up (+5 Credits)"}
          </button>
          <div className="h-px w-8 bg-slate-100 mx-auto"></div>
          <button onClick={onClose} className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
