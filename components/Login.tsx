
import React, { useState } from 'react';
import { LOGO } from '../constants';

const Login: React.FC<{ onLogin: (creds: { email: string; pass: string }) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center p-6 font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0A69E1] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-300 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-12 space-y-10 relative border border-white/40">
        <div className="text-center flex flex-col items-center">
          <LOGO />
          <h1 className="text-3xl font-black text-[#0A69E1] tracking-tighter mt-8">Admin Central</h1>
          <p className="text-slate-500 font-medium mt-2">Manage the NovaLink IT Ecosystem</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin({ email, pass }); }} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Username / Email</label>
              <div className="relative">
                <input
                  required
                  autoFocus
                  className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-[#0A69E1] outline-none text-slate-900 font-bold transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Key</label>
              <input
                type="password"
                required
                className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-8 focus:ring-blue-500/10 focus:border-[#0A69E1] outline-none text-slate-900 font-black tracking-widest transition-all shadow-sm placeholder:text-slate-300"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0A69E1] hover:bg-[#0857b8] text-white font-black py-5 rounded-[24px] shadow-2xl shadow-blue-600/30 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
          >
            Authenticate
          </button>
        </form>

        <div className="text-center pt-8 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Security Notice: Admin Credentials Required.
            <br />
            <span className="text-[#0A69E1] mt-2 block opacity-60">Default: admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
