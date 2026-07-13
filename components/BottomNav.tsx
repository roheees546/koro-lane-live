"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Dynamic Terminal Routing Logic
  const handleTerminalClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please login first to access your Terminal.");
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('role, store_name').eq('id', session.user.id).single();

    // If user has a store, they are technically a Buyer + Seller. Show selection modal.
    if (profile?.store_name || profile?.role === 'dealer') {
      setShowRoleModal(true);
    } else {
      // Pure Buyer
      router.push('/scout');
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#0a0a0c]/95 backdrop-blur-md border-t border-gray-900 flex justify-between items-center px-6 py-4 z-40 pb-6">
        <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </Link>
        
        <Link href="/shop" className={`flex flex-col items-center gap-1 ${pathname === '/shop' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Shop</span>
        </Link>

        {/* Community Style Feed (+) */}
        <Link href="/feed/create" className="flex items-center justify-center bg-[#00e599] text-black w-12 h-12 rounded-full -mt-6 shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:scale-105 transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
        </Link>

        <Link href="/wishlist" className={`flex flex-col items-center gap-1 ${pathname === '/wishlist' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Wishlist</span>
        </Link>

        <button onClick={handleTerminalClick} className={`flex flex-col items-center gap-1 ${pathname === '/scout' || pathname === '/dealer' ? 'text-[#00e599]' : 'text-gray-500 hover:text-gray-300'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-bold uppercase tracking-widest">Terminal</span>
        </button>
      </nav>

      {/* DUAL ROLE SELECTION MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowRoleModal(false)}>
          <div className="bg-[#121214] border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative" onClick={e => e.stopPropagation()}>
            <h3 className="text-[#00e599] font-black uppercase tracking-widest text-sm mb-6 text-center">Select Terminal</h3>
            <div className="space-y-4">
              <button onClick={() => { setShowRoleModal(false); router.push('/scout'); }} className="w-full bg-[#0a0a0c] border border-gray-800 hover:border-[#00e599] p-4 rounded-xl flex items-center justify-between group transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧑‍🚀</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300 group-hover:text-white">Buyer Terminal</span>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-[#00e599]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              
              <button onClick={() => { setShowRoleModal(false); router.push('/dealer'); }} className="w-full bg-[#003320]/20 border border-[#00e599]/30 hover:bg-[#003320]/50 p-4 rounded-xl flex items-center justify-between group transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏪</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#00e599]">Seller Terminal</span>
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