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

  const isDealerRoute = pathname?.startsWith('/dealer');

  useEffect(() => {
    const fetchRealRole = async (userId: string) => {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (profile) {
        setUserRole(profile.role);
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        await fetchRealRole(session.user.id);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        await fetchRealRole(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
      {!isDealerRoute && (
        <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#FFFFFF] border-t border-gray-200 flex justify-around items-center px-2 py-4 z-40 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
          
          {/* HOME */}
          <Link href="/" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/' ? 'text-[#FF3B30]' : 'text-gray-400 hover:text-gray-700 transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </Link>
          
          {/* SHOP */}
          <Link href="/shop" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/shop' ? 'text-[#FF3B30]' : 'text-gray-400 hover:text-gray-700 transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Shop</span>
          </Link>

          {/* FEED */}
          <Link href="/live" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/live' ? 'text-[#FF3B30]' : 'text-gray-400 hover:text-gray-700 transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
          </Link>

          {/* PROFILE */}
          <button onClick={handleProfileClick} className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/scout' || pathname === '/login' ? 'text-[#FF3B30]' : 'text-gray-400 hover:text-gray-700 transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
          </button>

        </nav>
      )}

      {/* ROLE SELECTION MODAL (Light Theme Update) */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5" onClick={() => setShowRoleModal(false)}>
          <div className="bg-[#FFFFFF] border border-gray-200 rounded-[32px] w-full max-w-sm p-8 relative overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#111111] mb-1">
                SELECT <span className="text-[#FF3B30]">PROFILE</span>
              </h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Choose your path on Koro Lane</p>
            </div>

            <div className="space-y-4">
              <button onClick={() => { setShowRoleModal(false); router.push(isLoggedIn ? '/scout' : '/login?role=buyer'); }} className="w-full bg-[#F6F3EE] border border-gray-200 hover:border-[#FF3B30]/50 p-4 rounded-2xl flex items-center gap-4 text-left transition shadow-sm">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-xl shadow-sm">🧑‍🚀</div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#111111] mb-0.5">Buyer Profile</h4>
                  <p className="text-[10px] font-medium text-gray-500">Shop unique thrift finds.</p>
                </div>
              </button>
              
              <button onClick={() => { setShowRoleModal(false); router.push(isLoggedIn ? '/dealer' : '/login?role=seller'); }} className="w-full bg-[#F6F3EE] border border-gray-200 hover:border-[#FF3B30]/50 p-4 rounded-2xl flex items-center gap-4 text-left transition shadow-sm">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-xl shadow-sm">🏪</div>
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#111111] mb-0.5">Seller Profile</h4>
                  <p className="text-[10px] font-medium text-gray-500">List your surplus drops.</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}