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
      // 1. Not logged in -> Send to Universal Login Page
      router.push('/login');
    } else {
      // 2. Logged in -> Direct Route based on user role
      if (userRole === 'dealer') {
        router.push('/dealer');
      } else if (userRole === 'scout') {
        router.push('/scout');
      } else {
        // Fallback just in case role is missing
        setShowRoleModal(true);
      }
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#0a0a0c]/95 backdrop-blur-md border-t border-gray-900 flex justify-around items-center px-2 py-4 z-40 pb-6">
        
        {/* 1. HOME */}
        <Link href="/" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </Link>
        
        {/* 2. SHOP */}
        <Link href="/shop" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/shop' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Shop</span>
        </Link>

        {/* 3. LIVE */}
        <Link href="/feed" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/feed' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Live</span>
        </Link>

        {/* 4. PROFILE */}
        <button onClick={handleProfileClick} className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/scout' || pathname === '/dealer' || pathname === '/login' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300 transition'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Profile</span>
        </button>

      </nav>

      {/* BACKUP: DUAL ROLE SELECTION MODAL (Only shows if role is missing) */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowRoleModal(false)}>
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-[#00e599] font-black uppercase tracking-widest text-sm mb-6 text-center">Select Profile</h3>
            <div className="space-y-4">
              <button onClick={() => { setShowRoleModal(false); router.push('/scout'); }} className="w-full bg-[#0a0a0c] border border-gray-800 hover:border-[#00e599] p-4 rounded-xl flex items-center justify-between group transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧑‍🚀</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300 group-hover:text-white">Buyer Profile</span>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              
              <button onClick={() => { setShowRoleModal(false); router.push('/dealer'); }} className="w-full bg-[#003320]/20 border border-[#00e599]/30 hover:bg-[#003320]/50 p-4 rounded-xl flex items-center justify-between group transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏪</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00e599]">Seller Profile</span>
                </div>
                <svg className="w-4 h-4 text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}