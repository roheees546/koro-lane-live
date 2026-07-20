"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UnifiedLogin() {
  const router = useRouter();
  
  // States
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);

  // 📧 Email/Password Auth Handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (role === 'seller' && !agreeRules) {
          alert("Bawa, pehle Koro Lane seller rules agree karo! 📜");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role === 'buyer' ? 'scout' : 'dealer' }
          }
        });
        if (error) throw error;
        alert(`Welcome to Koro Lane! Your ${role} account is created. 🎉`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      
      // Smart Routing
      router.push(role === 'buyer' ? "/scout" : "/dealer");
      
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Bawa, pehle email toh daalo! 📩");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) alert(error.message);
    else alert("Reset link sent! Apni email check karo. 🚀");
    setLoading(false);
  };

  // 🌐 Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${role === 'buyer' ? 'scout' : 'dealer'}`
      }
    });
    if (error) {
      alert("Google Login Error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#00e599] selection:text-black">
      
      {/* Header */}
      <header className="px-6 py-6 absolute top-0 left-0 w-full z-10">
        <Link href="/" className="text-xl font-black tracking-tighter hover:text-gray-300 transition w-max block">
          KORO <span className="text-[#00e599]">LANE</span>
        </Link>
      </header>

      {/* Main Login Card Area */}
      <div className="flex-1 flex items-center justify-center p-5 mt-10">
        <div className="w-full max-w-[400px] bg-[#0a0a0c] border border-gray-900 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          
          {/* 🔥 Top Neon Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00e599] shadow-[0_0_30px_#00e599]"></div>

          <div className="text-center mb-6 mt-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
              {mode === 'login' ? 'WELCOME BACK' : 'JOIN KORO LANE'}
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {mode === 'login' ? 'Sign in to continue your thrift journey.' : 'Create an account to start exploring.'}
            </p>
          </div>

          {/* 🎛️ Tabs: Buyer vs Seller */}
          <div className="flex border-b border-gray-900 mb-6">
            <button 
              onClick={() => setRole('buyer')}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${role === 'buyer' ? 'text-[#00e599] border-b-2 border-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Buyer {mode === 'login' ? 'Login' : 'Signup'}
            </button>
            <button 
              onClick={() => setRole('seller')}
              className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${role === 'seller' ? 'text-[#00e599] border-b-2 border-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Seller {mode === 'login' ? 'Login' : 'Signup'}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Email Input */}
            <div>
              <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Email Address *</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-[#121214] border border-gray-900 rounded-xl text-white pl-11 pr-4 py-3.5 text-sm outline-none focus:border-[#00e599] transition" 
                  placeholder="Enter email address" 
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-widest">Password *</label>
                {mode === 'login' && (
                  <button type="button" onClick={handleForgotPassword} className="text-[9px] text-[#00e599] hover:underline uppercase font-black tracking-widest">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <input 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-[#121214] border border-gray-900 rounded-xl text-white pl-11 pr-11 py-3.5 text-sm outline-none focus:border-[#00e599] transition" 
                  placeholder="Enter your password" 
                />
                {/* 👁️ Eye Icon Button */}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Seller Rules (Only visible during Seller Signup) */}
            {mode === 'signup' && role === 'seller' && (
              <div className="bg-[#003320]/20 border border-[#00e599]/30 rounded-xl p-4 mt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rules" required checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} className="accent-[#00e599] w-3.5 h-3.5 cursor-pointer" />
                  <label htmlFor="rules" className="text-[9px] text-[#00e599] font-black uppercase tracking-widest cursor-pointer hover:text-white transition">
                    I AGREE TO KORO LANE SELLER RULES (5% FEE)
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (mode === 'signup' && role === 'seller' && !agreeRules)} 
              className="w-full bg-[#00e599] text-black font-black py-4 rounded-xl uppercase tracking-widest text-[11px] hover:bg-emerald-400 transition duration-300 shadow-[0_0_20px_rgba(0,229,153,0.2)] disabled:opacity-50 mt-4 active:scale-[0.98]"
            >
              {loading ? "Authenticating..." : (mode === 'login' ? "Login" : "Sign Up")}
            </button>
          </form>

          {/* 🌐 SOCIAL LOGIN ROW */}
          <div className="mt-8 mb-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-900"></div></div>
            <div className="relative flex justify-center text-[9px] font-bold uppercase tracking-widest"><span className="bg-[#0a0a0c] px-3 text-gray-500">OR CONTINUE WITH</span></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={handleGoogleLogin} className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-[#121214] border border-gray-900 rounded-xl hover:border-gray-700 hover:bg-gray-900 transition group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Google</span>
            </button>
            <button onClick={() => alert("Apple Login coming soon! 🍏")} className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-[#121214] border border-gray-900 rounded-xl hover:border-gray-700 hover:bg-gray-900 transition group">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.31-.88 3.5-.8 1.49.09 2.59.57 3.23 1.35-2.69 1.4-2.18 4.92.51 5.92-.66 1.76-1.56 3.47-2.32 5.7zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Apple</span>
            </button>
            <button onClick={() => alert("Phone Login (OTP) coming soon! 📱")} className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-[#121214] border border-gray-900 rounded-xl hover:border-gray-700 hover:bg-gray-900 transition group">
              <svg className="w-5 h-5 text-[#00e599] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Phone</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-900 text-center">
            <button 
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setAgreeRules(false);
              }} 
              className="text-[10px] text-gray-500 uppercase tracking-widest font-bold hover:text-white transition"
            >
              {mode === 'login' ? (
                <>NEW TO KOROLANE? <span className="text-[#00e599]">SIGN UP</span></>
              ) : (
                <>ALREADY HAVE AN ACCOUNT? <span className="text-[#00e599]">LOGIN</span></>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}