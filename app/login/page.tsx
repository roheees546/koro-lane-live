"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DealerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [agreeRules, setAgreeRules] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!agreeRules) {
          alert("Bawa, pehle rules agree karo! 📜");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'dealer' }
          }
        });
        if (error) throw error;
        alert("Welcome to Koro Lane! Your Dealer account is created. 🏪");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      
      router.push("/dealer");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: PASSWORD RESET ENGINE
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
    else alert("Reset link sent! Apni email check karo, bawa. 🚀");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      <header className="px-6 py-5 border-b border-gray-900">
        <Link href="/" className="text-xl font-black tracking-tighter hover:text-gray-300 transition w-max block">
          KORO <span className="text-[#00e599]">LANE</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md bg-[#0a0a0c] border border-gray-800 rounded-2xl p-8 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00e599] shadow-[0_0_20px_#00e599]"></div>

          <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-[#00e599]">
            {mode === 'login' ? 'Dealer Portal' : 'Apply as Dealer'}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
            {mode === 'login' ? 'Manage your surplus drops.' : 'Start selling your rare items.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Email Address *</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-4 py-3 text-sm outline-none focus:border-[#00e599] transition" 
                placeholder="store@domain.com" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest">Password *</label>
                {/* 🔑 FORGOT PASSWORD BUTTON */}
                {mode === 'login' && (
                  <button type="button" onClick={handleForgotPassword} className="text-[9px] text-[#00e599] hover:underline uppercase font-black">
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-[#121214] border border-gray-800 rounded-lg text-white px-4 py-3 text-sm outline-none focus:border-[#00e599] transition" 
                placeholder="••••••••" 
              />
            </div>

            {mode === 'signup' && (
              <div className="bg-[#003320]/20 border border-[#00e599]/30 rounded-xl p-4 mt-2">
                <h3 className="text-[#00e599] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Strict Platform Rules
                </h3>
                <ul className="text-[9px] text-gray-300 space-y-2.5 uppercase tracking-wider font-bold">
                  <li className="flex gap-2 items-start"><span className="text-red-500">🚫</span> <span>Zada fate purane clothes not allowed.</span></li>
                  <li className="flex gap-2 items-start"><span className="text-red-500">🚫</span> <span>Branded clothes not allowed.</span></li>
                  <li className="flex gap-2 items-start"><span className="text-yellow-500">📏</span> <span>Measurements must be exact.</span></li>
                  <li className="flex gap-2 items-start"><span className="text-[#00e599] animate-pulse">💎</span> <span className="text-[#00e599]">5% fixed fee for first 50 sellers.</span></li>
                </ul>
                <div className="mt-4 pt-3 border-t border-[#00e599]/20 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="rules" 
                    required
                    checked={agreeRules} 
                    onChange={(e) => setAgreeRules(e.target.checked)} 
                    className="accent-[#00e599] w-3.5 h-3.5 cursor-pointer" 
                  />
                  <label htmlFor="rules" className="text-[9px] text-gray-400 uppercase tracking-widest cursor-pointer hover:text-white transition">
                    I AGREE TO KORO LANE RULES
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || (mode === 'signup' && !agreeRules)} 
              className="w-full bg-[#003320] text-[#00e599] border border-[#00e599]/30 font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-[#00e599] hover:text-black transition duration-300 shadow-[0_0_15px_rgba(0,229,153,0.1)] disabled:opacity-50 mt-4"
            >
              {loading ? "Authenticating..." : (mode === 'login' ? "Access Dashboard" : "Create Dealer Account")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-900 text-center">
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setAgreeRules(false);
              }} 
              className="text-[10px] text-gray-500 uppercase tracking-widest font-bold hover:text-white transition"
            >
              {mode === 'login' ? "New Seller? Apply Here" : "Already have a store? Login"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}