"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 🔐 Check Auth Status & Listen for Login/Logout events
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserRole(session.user.user_metadata?.role || null);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserRole(session.user.user_metadata?.role || null);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🔥 SMART PROFILE ROUTING
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setShowRoleModal(true);
    } else {
      if (userRole === 'dealer') {
        router.push('/dealer');
      } else if (userRole === 'scout') {
        router.push('/scout');
      } else {
        setShowRoleModal(true);
      }
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#0a0a0c]/95 backdrop-blur-md border-t border-gray-900 flex justify-around items-center px-2 py-4 z-40 pb-6">
        
        {/* HOME */}
        <Link href="/" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </Link>
        
        {/* SHOP */}
        <Link href="/shop" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/shop' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Shop</span>
        </Link>

        {/* LIVE */}
        <Link href="/feed" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/feed' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
        </Link>

        {/* PROFILE */}
        <button onClick={handleProfileClick} className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/scout' || pathname === '/dealer' || pathname === '/login' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
        </button>

      </nav>

      {/* 🔥 PREMIUM UI: DUAL ROLE SELECTION MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-5" onClick={() => setShowRoleModal(false)}>
          <div className="bg-[#0a0a0c] border border-gray-900 shadow-[0_0_50px_rgba(0,229,153,0.05)] rounded-[32px] w-full max-w-sm p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Top Glowing Icon */}
            <div className="flex justify-center mb-6 relative">
              {/* Glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#00e599]/20 blur-2xl rounded-full"></div>
              {/* Icon Circle */}
              <div className="relative w-14 h-14 bg-[#050505] border border-[#00e599]/50 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,229,153,0.3)]">
                <svg className="w-6 h-6 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              {/* Sparkles */}
              <span className="absolute top-0 right-8 text-[#00e599] text-lg animate-pulse">✦</span>
              <span className="absolute bottom-2 left-6 text-[#00e599] text-sm animate-pulse">✦</span>
            </div>

            {/* Header Text */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black uppercase tracking-widest text-white mb-2">
                SELECT <span className="text-[#00e599]">PROFILE</span>
              </h3>
              <p className="text-xs text-gray-400">Choose how you want to continue on Koro Lane</p>
            </div>

            {/* Diamond Divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-gray-700"></div>
              <div className="w-1.5 h-1.5 bg-[#00e599] rotate-45"></div>
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-gray-700"></div>
            </div>

            <div className="space-y-4">
              
              {/* Buyer Route */}
              <button onClick={() => { setShowRoleModal(false); router.push(isLoggedIn ? '/scout' : '/login?role=buyer'); }} className="w-full bg-[#121214] border border-gray-800 hover:border-gray-600 p-4 rounded-2xl flex items-center gap-4 group transition text-left">
                <div className="w-12 h-12 rounded-full bg-[#0a0a0c] border border-gray-800 flex items-center justify-center shrink-0 text-xl">
                  🧑‍🚀
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-200 group-hover:text-white mb-1">Buyer Profile</h4>
                  <p className="text-[10px] text-gray-500 leading-tight">Shop unique thrift finds and<br/>build your style.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0a0a0c] border border-gray-800 flex items-center justify-center group-hover:border-gray-600 transition shrink-0">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
              
              {/* Seller Route */}
              <button onClick={() => { setShowRoleModal(false); router.push(isLoggedIn ? '/dealer' : '/login?role=seller'); }} className="w-full bg-[#003320]/20 border border-[#00e599] hover:bg-[#003320]/40 p-4 rounded-2xl flex items-center gap-4 group transition text-left shadow-[0_0_15px_rgba(0,229,153,0.1)] hover:shadow-[0_0_25px_rgba(0,229,153,0.2)]">
                <div className="w-12 h-12 rounded-full bg-[#050505] border border-[#00e599]/30 flex items-center justify-center shrink-0 text-xl">
                  🏪
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#00e599] mb-1">Seller Profile</h4>
                  <p className="text-[10px] text-[#00e599]/70 leading-tight">List your surplus drops and<br/>grow your store.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#050505] border border-[#00e599]/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>

            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-5 border-t border-gray-900 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              <p className="text-[9px] text-gray-500">
                Secure. Verified. Built for the <span className="text-[#00e599] font-bold">thrift community</span>.
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}