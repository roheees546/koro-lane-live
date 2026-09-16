"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [selectedRole, setSelectedRole] = useState<'scout' | 'dealer' | null>(null);
  const [agreeRules, setAgreeRules] = useState(false);

  useEffect(() => {
    // 1. Initial Check: Agar URL mein access_token hai, toh Supabase ko time do, turant redirect mat karo.
    const verifyUser = async () => {
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        // Wait for onAuthStateChange to handle it
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
      }
    };

    verifyUser();

    // 2. Real-time Listener: Ye aaram se token process hone ke baad chalega
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.role === 'dealer') {
          window.location.href = '/dealer';
        } else if (profile && profile.role === 'scout') {
          window.location.href = '/scout';
        } else {
          // Profile pending hai, loading hatao aur Onboarding dikhao
          setCheckingAuth(false);
        }
      } else if (event === 'SIGNED_OUT') {
        window.location.href = "/login";
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleCompleteSetup = async () => {
    if (!selectedRole) {
      alert("Bawa, pehle ek profile toh select kar lo! 🧐");
      return;
    }

    if (selectedRole === 'dealer' && !agreeRules) {
      alert("Seller banne ke liye rules agree karne padenge bawa! 📜");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please login again.");

      const userId = session.user.id;
      const userEmail = session.user.email;
      const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "";
      const avatarUrl = session.user.user_metadata?.avatar_url || "";

      // A. Supabase Auth MetaData Update karo
      await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      // B. Database Check (Pehle check karo profile hai ya nahi)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // 🔥 UPDATE with .select() to catch silent RLS fails
        const { data: updatedData, error: updateError } = await supabase.from('profiles')
          .update({
            role: selectedRole,
            full_name: fullName,
            avatar_url: avatarUrl
          })
          .eq('id', userId)
          .select();

        if (updateError) throw updateError;
        
        // Agar Supabase ne silent fail kiya, toh yahan alert aayega!
        if (!updatedData || updatedData.length === 0) {
          alert("⚠️ SUPABASE ERROR: Tumhari profile update block ho gayi hai. Supabase mein RLS policies check karo.");
          setLoading(false);
          return;
        }
      } else {
        // Agar Bhoot trigger fail ho gaya tha, toh manually Insert karo
        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          email: userEmail,
          role: selectedRole,
          full_name: fullName,
          avatar_url: avatarUrl
        });
        if (insertError) throw insertError;
      }

      // C. Sahi Dashboard par Rawangi! (HARD RELOAD - No Next.js Cache loop 🚀)
      window.location.href = selectedRole === 'dealer' ? '/dealer' : '/scout';

    } catch (error: any) {
      alert("Error setting up profile: " + error.message);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center text-[#FF3B30] font-black tracking-widest text-xs uppercase">
        Verifying Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] flex flex-col font-sans selection:bg-[#FF3B30] selection:text-white pb-10">
      
      <header className="px-6 py-6 w-full flex justify-center">
        <div className="text-2xl font-black tracking-tighter text-[#111111]">
          KORO <span className="text-[#FF3B30]">LANE</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-5 max-w-[400px] mx-auto w-full mt-4">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#111111] leading-none mb-2">
            CHOOSE YOUR <br/> <span className="text-[#FF3B30]">PATH</span>
          </h1>
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            Welcome to the community. <br/> How do you want to use Koro Lane?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          
          <button 
            onClick={() => setSelectedRole('scout')}
            className={`w-full p-5 rounded-[24px] flex items-center gap-5 text-left transition-all duration-300 shadow-sm ${
              selectedRole === 'scout' 
                ? 'bg-[#FFFFFF] border-2 border-[#FF3B30] shadow-md scale-[1.02]' 
                : 'bg-[#FFFFFF] border-2 border-transparent hover:border-gray-300'
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-2xl transition-colors ${selectedRole === 'scout' ? 'bg-[#FCECEC]' : 'bg-gray-100'}`}>
              🛍️
            </div>
            <div className="flex-1">
              <h4 className="text-base font-black uppercase tracking-widest text-[#111111] mb-1">BUYER PROFILE</h4>
              <p className="text-[10px] font-medium text-gray-500 leading-tight">Shop exclusive 1-of-1 thrift drops and find unique fits.</p>
            </div>
          </button>

          <button 
            onClick={() => setSelectedRole('dealer')}
            className={`w-full p-5 rounded-[24px] flex items-center gap-5 text-left transition-all duration-300 shadow-sm ${
              selectedRole === 'dealer' 
                ? 'bg-[#FFFFFF] border-2 border-[#FF3B30] shadow-md scale-[1.02]' 
                : 'bg-[#FFFFFF] border-2 border-transparent hover:border-gray-300'
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-2xl transition-colors ${selectedRole === 'dealer' ? 'bg-[#FCECEC]' : 'bg-gray-100'}`}>
              🏪
            </div>
            <div className="flex-1">
              <h4 className="text-base font-black uppercase tracking-widest text-[#111111] mb-1">SELLER PROFILE</h4>
              <p className="text-[10px] font-medium text-gray-500 leading-tight">List your surplus drops and start your own online thrift store.</p>
            </div>
          </button>

        </div>

        <div className={`transition-all duration-500 overflow-hidden ${selectedRole === 'dealer' ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="bg-[#FCECEC] border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="rules" 
                checked={agreeRules} 
                onChange={(e) => setAgreeRules(e.target.checked)} 
                className="accent-[#FF3B30] w-4 h-4 cursor-pointer shrink-0" 
              />
              <label htmlFor="rules" className="text-[10px] text-[#FF3B30] font-black uppercase tracking-widest cursor-pointer leading-tight">
                I AGREE TO KORO LANE SELLER RULES & UNDERSTAND THE 5% PLATFORM FEE.
              </label>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCompleteSetup}
          disabled={loading || !selectedRole || (selectedRole === 'dealer' && !agreeRules)}
          className="w-full mt-auto bg-[#111111] text-white font-black py-4 rounded-xl uppercase tracking-widest text-[11px] hover:bg-black transition-all shadow-md disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Setting up profile..." : "Complete Setup"}
        </button>

      </div>
    </div>
  );
}