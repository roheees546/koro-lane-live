"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const isDealerRoute = pathname?.startsWith('/dealer');

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_url, store_logo')
        .eq('id', userId)
        .single();
        
      if (profile) {
        setUserRole(profile.role);
        // Agar seller hai to store_logo, warna normal buyer ka avatar_url
        setUserAvatar(profile.store_logo || profile.avatar_url || null);
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        await fetchUserProfile(session.user.id);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsLoggedIn(true);
        await fetchUserProfile(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserAvatar(null); // Log out pe DP gayab
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      // 1. Agar login nahi hai, seedha login page pe bhej do.
      router.push('/login');
    } else {
      // 2. Agar login hai, check karo uska role kya hai.
      if (userRole === 'dealer') {
        router.push('/dealer');
      } else if (userRole === 'scout') {
        router.push('/scout');
      } else {
        // 3. Agar login hai par profile nahi bani (role null hai), toh Onboarding page par bhej do.
        router.push('/onboarding');
      }
    }
  };

  return (
    <>
      {!isDealerRoute && (
        <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#FFFFFF] border-t border-gray-300 flex justify-around items-center px-2 py-4 z-40 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          
          {/* HOME */}
          <Link href="/" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/' ? 'text-[#FF3B30]' : 'text-[#555555] hover:text-[#111111] transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </Link>
          
          {/* SHOP */}
          <Link href="/shop" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/shop' ? 'text-[#FF3B30]' : 'text-[#555555] hover:text-[#111111] transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Shop</span>
          </Link>

          {/* FEED */}
          <Link href="/live" className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/live' ? 'text-[#FF3B30]' : 'text-[#555555] hover:text-[#111111] transition'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
          </Link>

          {/* 🔥 PROFILE / DYNAMIC AVATAR */}
          <button onClick={handleProfileClick} className={`flex flex-col items-center gap-1.5 w-16 ${pathname === '/scout' || pathname === '/login' || pathname === '/onboarding' ? 'text-[#FF3B30]' : 'text-[#555555] hover:text-[#111111] transition'}`}>
            {isLoggedIn && userAvatar ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden transition-all shadow-sm ${pathname === '/scout' || pathname === '/login' || pathname === '/onboarding' ? 'border-[2px] border-[#FF3B30] scale-110' : 'border border-gray-300'}`}>
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
          </button>

        </nav>
      )}
    </>
  );
}